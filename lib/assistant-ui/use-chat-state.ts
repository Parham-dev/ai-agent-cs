import { useState, useCallback } from 'react'
import type { ThreadMessage, AppendMessage } from '@assistant-ui/react'
import type { ApiAgent } from '@/lib/types'
import { 
  convertFromAssistantUI, 
  convertToAssistantUI, 
  convertHistoryToAPI,
  createErrorMessage,
  generateMessageId,
  type ChatMessage 
} from './message-converter'
import { chatApiClient } from './chat-api-client'

/**
 * Hook for managing chat state and API interactions
 * @param agent - The agent to chat with
 * @returns Chat state and handlers
 */
export function useChatState(agent: ApiAgent | null) {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  /**
   * Handle new messages from user
   */
  const onNew = useCallback(
    async (message: AppendMessage) => {
      if (!agent) {
        return
      }

      // Convert and add user message to UI state immediately
      const userMessage = convertFromAssistantUI(message)
      const userUIMessage = convertToAssistantUI(userMessage)
      setMessages((prev) => [...prev, userUIMessage])

      setIsRunning(true)

      try {
        // Get conversation history (excluding the message we just added)
        const conversationHistory = convertHistoryToAPI(messages)

        // Send to API
        const response = await chatApiClient.sendMessageToAgent(
          agent,
          userMessage.content || '',
          conversationHistory,
          sessionId
        )

        // Update session ID if provided
        if (response.sessionId) {
          setSessionId(response.sessionId)
        }

        // Create and add assistant response
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        }

        const assistantUIMessage = convertToAssistantUI(assistantMessage)
        setMessages((prev) => [...prev, assistantUIMessage])
        
      } catch (error) {
        console.error('Chat error occurred:', error)
        
        // Add error message
        const errorMessage = createErrorMessage(
          'Sorry, there was an error processing your message',
          error as Error
        )
        const errorUIMessage = convertToAssistantUI(errorMessage)
        setMessages((prev) => [...prev, errorUIMessage])
      } finally {
        setIsRunning(false)
      }
    },
    [agent, messages, sessionId]
  )

  /**
   * Handle reload of messages
   */
  const onReload = useCallback(
    async (parentId: string | null) => {
      if (!agent || !parentId) {
        return
      }

      // Find the message being reloaded
      const messageIndex = messages.findIndex(msg => msg.id === parentId)
      
      if (messageIndex === -1) {
        return
      }

      const messageToReload = messages[messageIndex]
      const messageRole = messageToReload.role

      let userMessage: { role: string; content: string } | null = null
      let conversationHistory: Array<{ role: string; content: string }> = []

      if (messageRole === 'assistant') {
        // Reloading an assistant message - find the user message that prompted it
        conversationHistory = convertHistoryToAPI(messages.slice(0, messageIndex))
        
        // Find the last user message in the conversation history
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
          if (conversationHistory[i].role === 'user') {
            userMessage = conversationHistory[i]
            break
          }
        }
      } else if (messageRole === 'user') {
        // Reloading a user message - use this message as the user message
        const chatMsg = convertFromAssistantUI(messageToReload)
        userMessage = {
          role: chatMsg.role,
          content: chatMsg.content || '',
        }
        
        // Get conversation history before this user message
        conversationHistory = convertHistoryToAPI(messages.slice(0, messageIndex))
      }

      if (!userMessage) {
        return
      }

      // Remove the message being reloaded and any messages after it
      setMessages((prev) => prev.slice(0, messageIndex))
      setIsRunning(true)

      try {
        // Prepare history for API (exclude user message for assistant reload)
        let apiConversationHistory = conversationHistory
        if (messageRole === 'assistant') {
          apiConversationHistory = conversationHistory.filter(msg => msg !== userMessage)
        }

        // Send API request to reload message
        const response = await chatApiClient.reloadMessage(
          agent,
          userMessage,
          apiConversationHistory,
          sessionId
        )

        // Update session ID if provided
        if (response.sessionId) {
          setSessionId(response.sessionId)
        }

        // Create new assistant response message
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        }

        const assistantUIMessage = convertToAssistantUI(assistantMessage)
        
        // Add messages based on what was reloaded
        if (messageRole === 'user') {
          // If we reloaded a user message, add both the user message and assistant response
          const userUIMessage = convertToAssistantUI({
            id: generateMessageId('msg-user'),
            role: 'user',
            content: userMessage.content || '',
            timestamp: new Date(),
          })
          setMessages((prev) => [...prev, userUIMessage, assistantUIMessage])
        } else {
          // If we reloaded an assistant message, just add the new assistant response
          setMessages((prev) => [...prev, assistantUIMessage])
        }
      } catch (error) {
        console.error('Reload error:', error)
        
        // Add error message
        const errorMessage = createErrorMessage(
          'Sorry, there was an error reloading the message. Please try again.'
        )
        const errorUIMessage = convertToAssistantUI(errorMessage)
        setMessages((prev) => [...prev, errorUIMessage])
      } finally {
        setIsRunning(false)
      }
    },
    [agent, messages, sessionId]
  )

  /**
   * Initialize chat (placeholder for future functionality)
   */
  const initializeChat = useCallback(() => {
    // Don't auto-send welcome message - let assistant-ui handle empty state
    // The ThreadPrimitive.Empty component will show the proper welcome UI
  }, [])

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([])
    setSessionId(null)
  }, [])

  /**
   * Update session ID
   */
  const updateSessionId = useCallback((newSessionId: string | null) => {
    setSessionId(newSessionId)
  }, [])

  return {
    messages,
    setMessages,
    isRunning,
    sessionId,
    onNew,
    onReload,
    initializeChat,
    clearMessages,
    updateSessionId,
  }
}