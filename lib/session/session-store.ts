/**
 * Simple in-memory session store for multi-turn conversations
 * Follows OpenAI Agents SDK patterns with AgentInputItem[] threads
 * 
 * Easily replaceable with database implementation later
 */

import { Agent, type AgentInputItem, MCPServerStdio } from '@openai/agents';
import { MCPClient } from '@/lib/mcp/client';
import { logger } from '@/lib/utils/logger';

export interface SessionData {
  sessionId: string;
  agentId: string;
  thread: AgentInputItem[];           // Conversation history following OpenAI SDK pattern
  agent: Agent;                       // Reusable agent instance  
  mcpServers: MCPServerStdio[];      // Persistent MCP servers
  mcpClient: MCPClient | null;       // MCP client instance
  lastActivity: Date;                // For cleanup/timeout
  metadata?: Record<string, unknown>; // Additional session context
}

/**
 * In-memory session store
 * TODO: Replace with database implementation (Redis/PostgreSQL)
 */
class InMemorySessionStore {
  private sessions = new Map<string, SessionData>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000;  // 5 minutes

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Get session data by session ID
   */
  get(sessionId: string): SessionData | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Update last activity
      session.lastActivity = new Date();
    }
    return session;
  }

  /**
   * Create or update session data
   */
  set(sessionId: string, sessionData: SessionData): void {
    sessionData.lastActivity = new Date();
    this.sessions.set(sessionId, sessionData);
    
    logger.debug('Session stored', { 
      sessionId, 
      agentId: sessionData.agentId,
      threadLength: sessionData.thread.length 
    });
  }

  /**
   * Check if session exists
   */
  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Delete session and cleanup resources
   */
  async delete(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Cleanup MCP servers
      if (session.mcpClient) {
        try {
          await session.mcpClient.closeAll();
          logger.debug('MCP servers cleaned up for session', { sessionId });
        } catch (error) {
          logger.error('Failed to cleanup MCP servers for session', { sessionId }, error as Error);
        }
      }
      
      this.sessions.delete(sessionId);
      logger.debug('Session deleted', { sessionId });
    }
  }

  /**
   * Get all session IDs
   */
  getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get sessions count
   */
  size(): number {
    return this.sessions.size;
  }

  /**
   * Clear all sessions (for testing or shutdown)
   */
  async clear(): Promise<void> {
    const sessionIds = this.getAllSessionIds();
    
    // Cleanup all sessions
    await Promise.all(
      sessionIds.map(sessionId => this.delete(sessionId))
    );
    
    logger.info('All sessions cleared', { count: sessionIds.length });
  }

  /**
   * Get session statistics
   */
  getStats(): { total: number; byAgent: Record<string, number> } {
    const byAgent: Record<string, number> = {};
    
    for (const session of this.sessions.values()) {
      byAgent[session.agentId] = (byAgent[session.agentId] || 0) + 1;
    }
    
    return {
      total: this.sessions.size,
      byAgent
    };
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Cleanup expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      
      if (timeSinceLastActivity > this.SESSION_TIMEOUT_MS) {
        expiredSessions.push(sessionId);
      }
    }
    
    if (expiredSessions.length > 0) {
      logger.info('Cleaning up expired sessions', { 
        count: expiredSessions.length,
        sessionIds: expiredSessions 
      });
      
      // Cleanup expired sessions
      await Promise.all(
        expiredSessions.map(sessionId => this.delete(sessionId))
      );
    }
  }

  /**
   * Stop cleanup timer (for testing or shutdown)
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Global session store instance
 * TODO: Replace with database-backed store in production
 */
export const sessionStore = new InMemorySessionStore();

/**
 * Graceful shutdown handler for session store
 */
export async function shutdownSessionStore(): Promise<void> {
  logger.info('Shutting down session store...');
  sessionStore.stop();
  await sessionStore.clear();
  logger.info('Session store shutdown complete');
}

// Register shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownSessionStore);
  process.on('SIGINT', shutdownSessionStore);
}