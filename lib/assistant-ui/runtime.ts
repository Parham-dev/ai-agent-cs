'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useExternalStoreRuntime } from '@assistant-ui/react'
import type { ThreadMessage, AppendMessage } from '@assistant-ui/react'
import type { ApiAgent } from '@/lib/types'
import { SessionThreadListAdapter } from './thread-list-adapter'

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
  const content = message.content || ''
  return {
    id: message.id,
    role: message.role as 'user' | 'assistant',
    content: [
      {
        type: 'text',
        text: content,
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
  const textContent = (message.content || [])
    .filter((c) => c.type === 'text')
    .map((c) => (c as { text: string }).text)
    .join('')

  return {
    id: ('id' in message ? message.id : `msg-${Date.now()}`) || `msg-${Date.now()}`,
    role: message.role as 'user' | 'assistant',
    content: textContent || '',
    timestamp: ('createdAt' in message ? message.createdAt : new Date()) || new Date(),
  }
}

export function useAgentChatRuntimeWithThreadList(agent: ApiAgent | null) {
  console.log('🚀 useAgentChatRuntimeWithThreadList called with agent:', agent?.name)
  
  // Create thread list adapter for this agent
  const threadListAdapter = useMemo(() => {
    if (!agent) return null
    try {
      console.log('🚀 Creating SessionThreadListAdapter for agent:', agent.id)
      return new SessionThreadListAdapter(agent.id)
    } catch (error) {
      console.error('Failed to create SessionThreadListAdapter:', error)
      return null
    }
  }, [agent])

  // Get base chat functionality
  const { messages, setMessages, isRunning, onNew, onReload, initializeChat } = useAgentChatRuntimeBase(agent)
  
  // Create runtime with thread list adapter using the correct pattern
  console.log('🚀 Creating useExternalStoreRuntime with thread list adapter')
  
  // Try a simpler approach - create the runtime without adapters first
  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    onNew,
    onReload,
  })
  
  // Then try to manually connect the adapter to the runtime
  React.useEffect(() => {
    if (runtime && threadListAdapter) {
      console.log('🚀 Manually connecting adapter to runtime')
      console.log('🚀 Runtime threads object:', runtime.threads)
      console.log('🚀 ThreadListAdapter object:', threadListAdapter)
      
      // Try to manually trigger the adapter
      setTimeout(async () => {
        console.log('🚀 Manually calling adapter.list()')
        try {
          const result = await threadListAdapter.list()
          console.log('🚀 Manual adapter.list() result:', result)
        } catch (error) {
          console.error('🚀 Manual adapter.list() error:', error)
        }
      }, 2000)
    }
  }, [runtime, threadListAdapter])

  console.log('🚀 Runtime with thread list created:', { 
    hasRuntime: !!runtime,
    hasThreadListAdapter: !!threadListAdapter,
    agentId: agent?.id 
  })

  return {
    runtime,
    threadListAdapter,
    initializeChat,
    messages,
    setMessages,
  }
}

export function useAgentChatRuntimeBase(agent: ApiAgent | null) {
  console.log('🚀 useAgentChatRuntime called with agent:', agent?.name)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  console.log('🚀 Runtime state:', { messagesCount: messages.length, isRunning, sessionId })

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

      // Convert and add user message to UI state immediately
      const userMessage = convertFromAssistantUI(message)
      const userUIMessage = convertToAssistantUI(userMessage)
      setMessages((prev) => [...prev, userUIMessage])

      console.log('🚀 Setting isRunning to true')
      setIsRunning(true)

      try {
        // Convert message history to your API format (excluding the user message we just added)
        const conversationHistory = messages.map((msg) => {
          const chatMsg = convertFromAssistantUI(msg)
          return {
            role: chatMsg.role,
            content: chatMsg.content || '',
          }
        })

        const requestBody = {
          agentId: agent.id,
          message: userMessage.content || '',
          sessionId: sessionId, // Include sessionId to continue conversation
          conversationHistory: conversationHistory,
        };
        
        console.log('🚀 Sending API request:', requestBody)

        // Call your existing API
        const response = await fetch('/api/v2/agents/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        console.log('🚀 Response status:', response.status, response.statusText)
        console.log('🚀 Response headers:', Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          console.log('🚀 Response not OK, response:', response)
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log('🚀 Raw API response received:', data)
        console.log('🚀 Response structure:', {
          success: data.success,
          dataKeys: data.data ? Object.keys(data.data) : 'no data',
          message: data.data?.message,
          sessionId: data.data?.sessionId,
          messageLength: data.data?.message?.length
        })

        // Store sessionId from the response for future requests
        if (data.success && data.data.sessionId) {
          setSessionId(data.data.sessionId)
          console.log('🚀 Session ID stored:', data.data.sessionId)
          
          // Notify thread list to refresh if we got a new session
          if (!sessionId && data.data.sessionId) {
            console.log('🚀 New session created, should refresh thread list')
            // The thread list will refresh automatically when it's next accessed
          }
        }

        // Create assistant response message
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: data.success
            ? data.data.message
            : 'Sorry, there was an error processing your message.',
          timestamp: new Date(),
        }
        
        console.log('🚀 Assistant message created:', assistantMessage)

        // Convert to assistant-ui format and add to messages
        const assistantUIMessage = convertToAssistantUI(assistantMessage)
        setMessages((prev) => [...prev, assistantUIMessage])
      } catch (error) {
        console.error('🚀 Chat error occurred:', error)
        console.error('🚀 Error details:', {
          name: (error as Error)?.name,
          message: (error as Error)?.message,
          stack: (error as Error)?.stack
        })
        
        // Add error message
        const errorMessage: ChatMessage = {
          id: `msg-error-${Date.now()}`,
          role: 'assistant',
          content: `❌ Sorry, there was an error processing your message: ${(error as Error)?.message || 'Unknown error'}. Please try again.`,
          timestamp: new Date(),
        }

        const errorUIMessage = convertToAssistantUI(errorMessage)
        setMessages((prev) => [...prev, errorUIMessage])
      } finally {
        console.log('🚀 Setting isRunning to false')
        setIsRunning(false)
      }
    },
    [agent, messages, sessionId]
  )

  // Handle reload of the last assistant message
  const onReload = useCallback(
    async (parentId: string | null) => {
      console.log('🚀 onReload called for parentId:', parentId)
      console.log('🚀 Current messages:', messages.map(m => ({ id: m.id, role: m.role, content: m.content })))
      
      if (!agent || !parentId) {
        console.log('🚀 No agent or parentId, returning early')
        return
      }

      // Find the message being reloaded and get conversation history up to that point
      const messageIndex = messages.findIndex(msg => msg.id === parentId)
      console.log('🚀 Message index found:', messageIndex)
      
      if (messageIndex === -1) {
        console.log('🚀 Message not found for reload')
        return
      }

      const messageToReload = messages[messageIndex]
      const messageRole = messageToReload.role
      console.log('🚀 Reloading message with role:', messageRole)

      let userMessage = null
      let conversationHistory: Array<{role: string, content: string}> = []

      if (messageRole === 'assistant') {
        // Reloading an assistant message - find the user message that prompted it
        conversationHistory = messages.slice(0, messageIndex).map((msg) => {
          const chatMsg = convertFromAssistantUI(msg)
          return {
            role: chatMsg.role,
            content: chatMsg.content || '',
          }
        })
        
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
        conversationHistory = messages.slice(0, messageIndex).map((msg) => {
          const chatMsg = convertFromAssistantUI(msg)
          return {
            role: chatMsg.role,
            content: chatMsg.content || '',
          }
        })
      }

      console.log('🚀 Conversation history:', conversationHistory)
      console.log('🚀 Found user message:', userMessage)
      
      if (!userMessage) {
        console.log('🚀 No user message found for reload')
        return
      }

      // Remove the message being reloaded and any messages after it
      setMessages((prev) => prev.slice(0, messageIndex))
      setIsRunning(true)

      try {
        // For user message reload, use the conversation history as-is
        // For assistant message reload, exclude the user message from history
        let apiConversationHistory = conversationHistory
        if (messageRole === 'assistant') {
          apiConversationHistory = conversationHistory.filter(msg => msg !== userMessage)
        }
        
        console.log('🚀 Sending API request with:', {
          agentId: agent.id,
          message: userMessage.content,
          conversationHistory: apiConversationHistory
        })

        // Call API with the same user message
        const response = await fetch('/api/v2/agents/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentId: agent.id,
            message: userMessage.content || '',
            sessionId: sessionId, // Include sessionId to continue conversation
            conversationHistory: apiConversationHistory,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to reload message')
        }

        const data = await response.json()

        // Store sessionId from the response for future requests
        if (data.success && data.data.sessionId) {
          setSessionId(data.data.sessionId)
        }

        // Create new assistant response message
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
        
        // If we reloaded a user message, add both the user message and assistant response
        // If we reloaded an assistant message, just add the new assistant response
        if (messageRole === 'user') {
          const userUIMessage = convertToAssistantUI({
            id: `msg-${Date.now()}-user`,
            role: 'user',
            content: userMessage.content || '',
            timestamp: new Date(),
          })
          setMessages((prev) => [...prev, userUIMessage, assistantUIMessage])
        } else {
          setMessages((prev) => [...prev, assistantUIMessage])
        }
      } catch (error) {
        console.error('Reload error:', error)
        
        // Add error message
        const errorMessage: ChatMessage = {
          id: `msg-error-${Date.now()}`,
          role: 'assistant',
          content: '❌ Sorry, there was an error reloading the message. Please try again.',
          timestamp: new Date(),
        }

        const errorUIMessage = convertToAssistantUI(errorMessage)
        setMessages((prev) => [...prev, errorUIMessage])
      } finally {
        setIsRunning(false)
      }
    },
    [agent, messages, sessionId]
  )

  return {
    messages,
    setMessages,
    isRunning,
    onNew,
    onReload,
    initializeChat,
  }
}

// Backward compatibility function for components that expect the old interface
export function useAgentChatRuntime(agent: ApiAgent | null) {
  const { messages, isRunning, onNew, onReload, initializeChat, setMessages } = useAgentChatRuntimeBase(agent)
  
  // Create the external store runtime without thread list support
  console.log('🚀 Creating external store runtime with:', { messagesCount: messages.length, isRunning })
  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    onNew,
    onReload,
  })
  console.log('🚀 External store runtime created:', runtime)

  return {
    runtime,
    initializeChat,
    messages,
    setMessages,
  }
}