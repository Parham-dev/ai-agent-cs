'use client'

import React, { useMemo } from 'react'
import { useExternalStoreRuntime } from '@assistant-ui/react'
import type { ApiAgent } from '@/lib/types'
import { SessionThreadListAdapter } from './thread-list-adapter'
import { useChatState } from './use-chat-state'

/**
 * Hook for agent chat runtime with thread list support
 * @param agent - The agent to create runtime for
 * @returns Runtime with thread list integration
 */
export function useAgentChatRuntimeWithThreadList(agent: ApiAgent | null) {
  // Create thread list adapter for this agent
  const threadListAdapter = useMemo(() => {
    if (!agent) return null
    try {
      return new SessionThreadListAdapter(agent.id)
    } catch (error) {
      console.error('Failed to create SessionThreadListAdapter:', error)
      return null
    }
  }, [agent])

  // Get base chat functionality
  const chatState = useChatState(agent)
  
  // Create runtime with external store
  const runtime = useExternalStoreRuntime({
    messages: chatState.messages,
    isRunning: chatState.isRunning,
    onNew: chatState.onNew,
    onReload: chatState.onReload,
  })
  
  // Connect the adapter to the runtime
  React.useEffect(() => {
    if (runtime && threadListAdapter) {
      // Try to manually trigger the adapter after a delay
      const timer = setTimeout(async () => {
        try {
          await threadListAdapter.list()
        } catch (error) {
          console.error('Manual adapter.list() error:', error)
        }
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [runtime, threadListAdapter])

  return {
    runtime,
    threadListAdapter,
    initializeChat: chatState.initializeChat,
    messages: chatState.messages,
    setMessages: chatState.setMessages,
    clearMessages: chatState.clearMessages,
    updateSessionId: chatState.updateSessionId,
  }
}

/**
 * Base agent chat runtime without thread list support
 * @param agent - The agent to create runtime for
 * @returns Basic chat runtime
 */
export function useAgentChatRuntimeBase(agent: ApiAgent | null) {
  const chatState = useChatState(agent)

  return {
    messages: chatState.messages,
    setMessages: chatState.setMessages,
    isRunning: chatState.isRunning,
    sessionId: chatState.sessionId,
    onNew: chatState.onNew,
    onReload: chatState.onReload,
    initializeChat: chatState.initializeChat,
    clearMessages: chatState.clearMessages,
    updateSessionId: chatState.updateSessionId,
  }
}

/**
 * Backward compatibility function for components that expect the old interface
 * @param agent - The agent to create runtime for
 * @returns Compatible runtime interface
 */
export function useAgentChatRuntime(agent: ApiAgent | null) {
  const chatState = useChatState(agent)
  
  // Create the external store runtime without thread list support
  const runtime = useExternalStoreRuntime({
    messages: chatState.messages,
    isRunning: chatState.isRunning,
    onNew: chatState.onNew,
    onReload: chatState.onReload,
  })

  return {
    runtime,
    initializeChat: chatState.initializeChat,
    messages: chatState.messages,
    setMessages: chatState.setMessages,
    clearMessages: chatState.clearMessages,
    updateSessionId: chatState.updateSessionId,
  }
}