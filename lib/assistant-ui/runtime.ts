'use client'

import { useState, useCallback } from 'react'
import { useExternalStoreRuntime } from '@assistant-ui/react'
import type { ThreadMessage, AppendMessage } from '@assistant-ui/react'
import type { ApiAgent } from '@/lib/types'

// Message interface matching your current system
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    toolCalls?: Array<{
      name: string
      args: Record<string, unknown>
      result?: unknown
    }>
  }
}

// Convert your message format to assistant-ui format
function convertToAssistantUI(message: ChatMessage): ThreadMessage {
  return {
    id: message.id,
    role: message.role as 'user' | 'assistant',
    content: [
      {
        type: 'text',
        text: message.content,
      },
    ],
    createdAt: message.timestamp,
    metadata: { 
      custom: {}
    },
    status: { type: 'complete', reason: 'stop' },
  } as unknown as ThreadMessage
}

// Convert assistant-ui format to your message format
function convertFromAssistantUI(message: AppendMessage | ThreadMessage): ChatMessage {
  const textContent = message.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { text: string }).text)
    .join('')

  return {
    id: ('id' in message ? message.id : `msg-${Date.now()}`) || `msg-${Date.now()}`,
    role: message.role as 'user' | 'assistant',
    content: textContent,
    timestamp: ('createdAt' in message ? message.createdAt : new Date()) || new Date(),
  }
}

export function useAgentChatRuntime(agent: ApiAgent | null) {
  console.log('🚀 useAgentChatRuntime called with agent:', agent?.name)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [isRunning, setIsRunning] = useState(false)
  console.log('🚀 Runtime state:', { messagesCount: messages.length, isRunning })

  // Initialize with welcome message when agent loads
  const initializeChat = useCallback(() => {
    console.log('🚀 initializeChat called:', { agent: agent?.name, messagesLength: messages.length })
    if (agent && messages.length === 0) {
      console.log('🚀 Creating welcome message...')
      const welcomeMessage: ThreadMessage = {
        id: 'welcome',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: `👋 Hello! I'm **${agent.name}**.

${agent.systemPrompt || "I'm here to help you!"}

How can I help you today?`,
          },
        ],
        createdAt: new Date(),
        metadata: { 
          custom: {}
        },
        status: { type: 'complete', reason: 'stop' },
      } as unknown as ThreadMessage
      console.log('🚀 Setting welcome message:', welcomeMessage)
      setMessages([welcomeMessage])
      console.log('🚀 Welcome message set')
    } else {
      console.log('🚀 Skipping welcome message:', { hasAgent: !!agent, messagesLength: messages.length })
    }
  }, [agent, messages.length])

  // Handle new messages from user
  const onNew = useCallback(
    async (message: AppendMessage) => {
      console.log('🚀 onNew called with message:', message)
      if (!agent) {
        console.log('🚀 No agent, returning early')
        return
      }

      console.log('🚀 Setting isRunning to true')
      setIsRunning(true)

      try {
        // Convert message history to your API format
        const conversationHistory = messages.map((msg) => {
          const chatMsg = convertFromAssistantUI(msg)
          return {
            role: chatMsg.role,
            content: chatMsg.content,
          }
        })

        // Add current user message to history
        const userMessage = convertFromAssistantUI(message)
        conversationHistory.push({
          role: userMessage.role,
          content: userMessage.content,
        })

        // Call your existing API
        const response = await fetch('/api/v2/agents/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId: agent.id,
            message: userMessage.content,
            conversationHistory: conversationHistory.slice(0, -1), // Don't include current message
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const data = await response.json()

        // Create assistant response message
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: data.success
            ? data.data.message
            : 'Sorry, there was an error processing your message.',
          timestamp: new Date(),
        }

        // Convert to assistant-ui format and add to messages
        const assistantUIMessage = convertToAssistantUI(assistantMessage)
        setMessages((prev) => [...prev, assistantUIMessage])
      } catch (error) {
        console.error('Chat error:', error)
        
        // Add error message
        const errorMessage: ChatMessage = {
          id: `msg-error-${Date.now()}`,
          role: 'assistant',
          content: '❌ Sorry, there was an error processing your message. Please try again.',
          timestamp: new Date(),
        }

        const errorUIMessage = convertToAssistantUI(errorMessage)
        setMessages((prev) => [...prev, errorUIMessage])
      } finally {
        setIsRunning(false)
      }
    },
    [agent, messages]
  )

  // Create the external store runtime
  console.log('🚀 Creating external store runtime with:', { messagesCount: messages.length, isRunning })
  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    onNew,
  })
  console.log('🚀 External store runtime created:', runtime)

  return {
    runtime,
    initializeChat,
    messages,
    setMessages,
  }
}