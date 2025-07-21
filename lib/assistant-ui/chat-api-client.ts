import type { ApiAgent } from '@/lib/types'

/**
 * Request body for chat API
 */
export interface ChatApiRequest {
  agentId: string
  message: string
  sessionId?: string | null
  conversationHistory?: Array<{ role: string; content: string }>
}

/**
 * Response from chat API
 */
export interface ChatApiResponse {
  success: boolean
  data: {
    message: string
    sessionId?: string
  }
}

/**
 * Chat API client for handling communication with the chat endpoint
 */
export class ChatApiClient {
  private readonly endpoint = '/api/v2/agents/chat'

  /**
   * Send a message to the chat API
   * @param request - Chat request data
   * @returns Promise resolving to chat response
   */
  async sendMessage(request: ChatApiRequest): Promise<ChatApiResponse> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Send message with agent and conversation history
   * @param agent - Agent to send message to
   * @param message - Message content
   * @param conversationHistory - Previous conversation messages
   * @param sessionId - Optional session ID for continuity
   * @returns Promise resolving to assistant response
   */
  async sendMessageToAgent(
    agent: ApiAgent,
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    sessionId?: string | null
  ): Promise<{ message: string; sessionId?: string }> {
    const request: ChatApiRequest = {
      agentId: agent.id,
      message,
      conversationHistory,
      sessionId,
    }

    const response = await this.sendMessage(request)
    
    if (!response.success) {
      throw new Error('Chat API returned unsuccessful response')
    }

    return {
      message: response.data.message,
      sessionId: response.data.sessionId
    }
  }

  /**
   * Reload/retry a message with the same parameters
   * @param agent - Agent to send message to
   * @param userMessage - Original user message to retry
   * @param conversationHistory - Conversation history before the message
   * @param sessionId - Session ID
   * @returns Promise resolving to new assistant response
   */
  async reloadMessage(
    agent: ApiAgent,
    userMessage: { role: string; content: string },
    conversationHistory: Array<{ role: string; content: string }>,
    sessionId?: string | null
  ): Promise<{ message: string; sessionId?: string }> {
    // Filter out the user message from history if it's already included
    const filteredHistory = conversationHistory.filter(msg => msg !== userMessage)
    
    return this.sendMessageToAgent(
      agent,
      userMessage.content,
      filteredHistory,
      sessionId
    )
  }
}

/**
 * Default chat API client instance
 */
export const chatApiClient = new ChatApiClient()