'use client'

import type { 
  unstable_RemoteThreadListAdapter as RemoteThreadListAdapter 
} from '@assistant-ui/react'
import type { ThreadMessage } from '@assistant-ui/react'
import type { AssistantStream } from 'assistant-stream'

// Import types directly from the remote thread list types
type RemoteThreadMetadata = {
  readonly status: "regular" | "archived";
  readonly remoteId: string;
  readonly externalId?: string | undefined;
  readonly title?: string | undefined;
}

type RemoteThreadListResponse = {
  threads: RemoteThreadMetadata[];
}

type RemoteThreadInitializeResponse = {
  remoteId: string;
  externalId: string | undefined;
}

/**
 * Thread List Adapter for session-based chat
 * Integrates with our session-based API to provide multi-session support
 */
export class SessionThreadListAdapter implements RemoteThreadListAdapter {
  private agentId: string
  private sessions = new Map<string, RemoteThreadMetadata>()

  constructor(agentId: string) {
    this.agentId = agentId
  }

  /**
   * List all threads/sessions for the current agent
   */
  async list(): Promise<RemoteThreadListResponse> {
    try {
      // For now, return the sessions we have in memory
      // TODO: In the future, this could fetch from a database
      const threads = Array.from(this.sessions.values())
      
      return {
        threads: threads.sort((a, b) => {
          // Sort by creation time (most recent first)
          // For now, we'll use the remoteId as a proxy for creation time
          return b.remoteId.localeCompare(a.remoteId)
        })
      }
    } catch (error) {
      console.error('Failed to list threads:', error)
      return { threads: [] }
    }
  }

  /**
   * Rename a thread/session
   */
  async rename(remoteId: string, newTitle: string): Promise<void> {
    try {
      const session = this.sessions.get(remoteId)
      if (session) {
        this.sessions.set(remoteId, {
          ...session,
          title: newTitle
        })
      }
      
      // TODO: In the future, persist this to database
      console.log(`Renamed thread ${remoteId} to "${newTitle}"`)
    } catch (error) {
      console.error('Failed to rename thread:', error)
      throw error
    }
  }

  /**
   * Archive a thread/session
   */
  async archive(remoteId: string): Promise<void> {
    try {
      const session = this.sessions.get(remoteId)
      if (session) {
        this.sessions.set(remoteId, {
          ...session,
          status: 'archived'
        })
      }
      
      console.log(`Archived thread ${remoteId}`)
    } catch (error) {
      console.error('Failed to archive thread:', error)
      throw error
    }
  }

  /**
   * Unarchive a thread/session
   */
  async unarchive(remoteId: string): Promise<void> {
    try {
      const session = this.sessions.get(remoteId)
      if (session) {
        this.sessions.set(remoteId, {
          ...session,
          status: 'regular'
        })
      }
      
      console.log(`Unarchived thread ${remoteId}`)
    } catch (error) {
      console.error('Failed to unarchive thread:', error)
      throw error
    }
  }

  /**
   * Delete a thread/session
   */
  async delete(remoteId: string): Promise<void> {
    try {
      // Remove from our local cache
      this.sessions.delete(remoteId)
      
      // Call API to delete the session
      await fetch('/api/v2/agents/chat/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: remoteId,
          agentId: this.agentId
        }),
      })
      
      console.log(`Deleted thread ${remoteId}`)
    } catch (error) {
      console.error('Failed to delete thread:', error)
      throw error
    }
  }

  /**
   * Initialize a new thread/session
   * This creates a new session but doesn't send any messages yet
   */
  async initialize(threadId: string): Promise<RemoteThreadInitializeResponse> {
    try {
      // Generate a unique session ID
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Create session metadata
      const sessionMetadata: RemoteThreadMetadata = {
        status: 'regular',
        remoteId: sessionId,
        externalId: threadId,
        title: `New Chat ${new Date().toLocaleTimeString()}` // Default title
      }
      
      // Store in our local cache
      this.sessions.set(sessionId, sessionMetadata)
      
      console.log(`Initialized new thread ${threadId} with session ${sessionId}`)
      
      return {
        remoteId: sessionId,
        externalId: threadId
      }
    } catch (error) {
      console.error('Failed to initialize thread:', error)
      throw error
    }
  }

  /**
   * Generate a title for a thread based on its messages
   * This is called when the user sends their first message
   */
  async generateTitle(remoteId: string, unstable_messages: readonly ThreadMessage[]): Promise<AssistantStream> {
    try {
      // Get the first user message to generate a title
      const userMessages = unstable_messages.filter(m => m.role === 'user')
      const firstMessage = userMessages[0]?.content
        ?.filter(c => c.type === 'text')
        ?.map(c => (c as { text: string }).text)
        ?.join('') || 'New Chat'
      
      // Generate a short title from the first message
      let title = firstMessage.slice(0, 50)
      if (firstMessage.length > 50) {
        title += '...'
      }
      
      // Update the session metadata
      const session = this.sessions.get(remoteId)
      if (session) {
        this.sessions.set(remoteId, {
          ...session,
          title
        })
      }
      
      console.log(`Generated title for thread ${remoteId}: "${title}"`)
      
      // For now, throw an error since we don't need AI-generated titles
      // In the future, this could call an AI API to generate better titles
      throw new Error('Title generation not implemented - using manual titles for now')
    } catch (error) {
      console.error('Failed to generate title:', error)
      throw error
    }
  }

  /**
   * Update session metadata when a chat is active
   */
  updateSession(sessionId: string, updates: Partial<RemoteThreadMetadata>) {
    const session = this.sessions.get(sessionId)
    if (session) {
      this.sessions.set(sessionId, {
        ...session,
        ...updates
      })
    } else {
      // Create a new session entry if it doesn't exist
      this.sessions.set(sessionId, {
        status: 'regular',
        remoteId: sessionId,
        title: 'Active Chat',
        ...updates
      })
    }
  }

  /**
   * Get session metadata
   */
  getSession(sessionId: string): RemoteThreadMetadata | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get all sessions
   */
  getAllSessions(): RemoteThreadMetadata[] {
    return Array.from(this.sessions.values())
  }
}