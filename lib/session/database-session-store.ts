/**
 * Database-backed session store for multi-turn conversations
 * Simple approach: Store messages in DB, recreate Agent/MCP on session resume
 * No serialization/deserialization of runtime objects
 */

import { type AgentInputItem } from '@openai/agents'
import { logger } from '@/lib/utils/logger'
import { conversationsService } from '@/lib/database/services/conversations.service'
import { agentsService } from '@/lib/database/services/agents.service'
import { createAgent } from '@/lib/agents/agent-factory'
import { type SessionData, type PendingSessionData } from './session-types'

/**
 * Database-backed session store
 * - Conversation history persisted in database
 * - Runtime objects (Agent, MCP) recreated fresh on each session access
 * - Normal timeout cleanup (30min) handles runtime cleanup
 */
class DatabaseSessionStore {
  // Simple in-memory cache for active sessions (runtime objects only)
  private activeSessions = new Map<string, SessionData>()
  
  private cleanupInterval: NodeJS.Timeout | null = null
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.startCleanupTimer()
  }

  /**
   * Get session data by session ID
   * If session exists in memory, return it. Otherwise, load from database and recreate runtime.
   */
  async get(sessionId: string, organizationId: string): Promise<SessionData | null> {
    try {
      // Check if session is already active in memory
      const activeSession = this.activeSessions.get(sessionId)
      if (activeSession) {
        // Update last activity and return
        activeSession.lastActivity = new Date()
        return activeSession
      }

      // Load conversation history from database
      const conversations = await conversationsService.getConversations(organizationId, { 
        sessionId, 
        limit: 1 
      })
      
      if (conversations.length === 0) {
        return null
      }

      const conversation = conversations[0]

      // Get full conversation with messages
      const fullConversation = await conversationsService.getConversationById(
        organizationId, 
        conversation.id
      )

      if (!fullConversation) {
        return null
      }

      // For now, start with empty thread and let the chat API rebuild it
      // The OpenAI SDK manages thread format internally via response.history
      const thread: AgentInputItem[] = []

      // Get agent config and recreate runtime objects fresh
      const agentData = await agentsService.getAgentByIdOrThrow(organizationId, conversation.agentId)
      const { agent, mcpClient } = await createAgent(agentData)

      // Create session data
      const sessionData: SessionData = {
        sessionId,
        agentId: conversation.agentId,
        organizationId,
        conversationId: conversation.id,
        thread,
        agent,
        mcpClient,
        lastActivity: new Date(),
        metadata: (fullConversation.context as Record<string, unknown>) || {}
      }

      // Cache in memory for subsequent requests
      this.activeSessions.set(sessionId, sessionData)

      logger.debug('Session loaded from database and runtime recreated', {
        sessionId,
        conversationId: conversation.id,
        agentId: conversation.agentId,
        threadLength: thread.length
      })

      return sessionData
    } catch (error) {
      logger.error('Failed to get session', { sessionId, organizationId }, error as Error)
      return null
    }
  }

  /**
   * Create or update session data
   * Updates memory cache and conversation metadata
   */
  async set(sessionId: string, sessionData: SessionData | PendingSessionData): Promise<void> {
    try {
      // Update memory cache
      sessionData.lastActivity = new Date()

      // Create conversation if it doesn't exist (for PendingSessionData)
      if (!sessionData.conversationId) {
        const conversation = await conversationsService.createConversation(
          sessionData.organizationId,
          {
            agentId: sessionData.agentId,
            sessionId,
            context: sessionData.metadata
          }
        )
        sessionData.conversationId = conversation.id
      }

      // Ensure we have a complete SessionData with conversationId
      const completeSessionData: SessionData = {
        ...sessionData,
        conversationId: sessionData.conversationId!
      }

      // Store in memory cache
      this.activeSessions.set(sessionId, completeSessionData)

      // Update conversation context and last activity
      await conversationsService.updateConversation(
        sessionData.organizationId,
        sessionData.conversationId!,
        {
          context: sessionData.metadata,
          lastMessageAt: sessionData.lastActivity
        }
      )

      logger.debug('Session updated', {
        sessionId,
        conversationId: sessionData.conversationId,
        agentId: sessionData.agentId,
        threadLength: sessionData.thread.length
      })
    } catch (error) {
      logger.error('Failed to store session', { sessionId }, error as Error)
      throw error
    }
  }

  /**
   * Check if session exists (in memory or database)
   */
  has(sessionId: string): boolean {
    return this.activeSessions.has(sessionId)
  }

  /**
   * Delete session and cleanup resources
   */
  async delete(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId)
      if (session?.mcpClient) {
        try {
          await session.mcpClient.closeAll()
          logger.debug('MCP servers cleaned up for session', { sessionId })
        } catch (error) {
          logger.error('Failed to cleanup MCP servers for session', { sessionId }, error as Error)
        }
      }

      this.activeSessions.delete(sessionId)
      logger.debug('Session removed from memory', { sessionId })
    } catch (error) {
      logger.error('Failed to delete session', { sessionId }, error as Error)
      throw error
    }
  }

  /**
   * Add message to session and persist to database
   */
  async addMessage(
    sessionId: string, 
    message: AgentInputItem,
    organizationId: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Extract role and content from AgentInputItem
      let role: 'USER' | 'ASSISTANT' | 'SYSTEM' = 'USER'
      let content = ''

      if ('role' in message && 'content' in message) {
        role = message.role.toUpperCase() as 'USER' | 'ASSISTANT' | 'SYSTEM'
        content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content)
      }

      // Persist message to database
      await conversationsService.createMessage(organizationId, {
        conversationId,
        role,
        content
      })

      // Update session thread in memory if session is active
      const session = this.activeSessions.get(sessionId)
      if (session) {
        session.thread.push(message)
        session.lastActivity = new Date()
      }

      logger.debug('Message added to session', {
        sessionId,
        conversationId,
        role,
        contentLength: content.length
      })
    } catch (error) {
      logger.error('Failed to add message to session', { sessionId }, error as Error)
      throw error
    }
  }

  /**
   * Get session statistics from active sessions
   */
  getStats(): { total: number; byAgent: Record<string, number> } {
    const byAgent: Record<string, number> = {}
    
    for (const session of this.activeSessions.values()) {
      byAgent[session.agentId] = (byAgent[session.agentId] || 0) + 1
    }
    
    return {
      total: this.activeSessions.size,
      byAgent
    }
  }

  /**
   * Clear all active sessions
   */
  async clear(): Promise<void> {
    const sessionIds = Array.from(this.activeSessions.keys())
    
    await Promise.all(
      sessionIds.map(sessionId => this.delete(sessionId))
    )
    
    logger.info('All sessions cleared', { count: sessionIds.length })
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions()
    }, this.CLEANUP_INTERVAL_MS)
  }

  /**
   * Cleanup expired sessions (same as original in-memory store)
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = new Date()
    const expiredSessions: string[] = []

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime()

      if (timeSinceLastActivity > this.SESSION_TIMEOUT_MS) {
        expiredSessions.push(sessionId)
      }
    }

    if (expiredSessions.length > 0) {
      logger.info('Cleaning up expired sessions', {
        count: expiredSessions.length,
        sessionIds: expiredSessions
      })

      await Promise.all(
        expiredSessions.map(sessionId => this.delete(sessionId))
      )
    }
  }

  /**
   * Stop cleanup timer
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

/**
 * Global database session store instance
 */
export const sessionStore = new DatabaseSessionStore()

/**
 * Graceful shutdown handler for session store
 */
export async function shutdownSessionStore(): Promise<void> {
  logger.info('Shutting down session store...')
  sessionStore.stop()
  await sessionStore.clear()
  logger.info('Session store shutdown complete')
}

// Register shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownSessionStore)
  process.on('SIGINT', shutdownSessionStore)
}