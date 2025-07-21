import type { ThreadMessage, AppendMessage } from '@assistant-ui/react'

/**
 * Message interface matching the current system
 */
export interface ChatMessage {
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

/**
 * Convert ChatMessage format to assistant-ui ThreadMessage format
 * @param message - ChatMessage to convert
 * @returns ThreadMessage in assistant-ui format
 */
export function convertToAssistantUI(message: ChatMessage): ThreadMessage {
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
      custom: message.metadata || {}
    },
    status: { type: 'complete', reason: 'stop' },
  } as unknown as ThreadMessage
}

/**
 * Convert assistant-ui message format to ChatMessage format
 * @param message - AssistantUI message to convert
 * @returns ChatMessage in internal format
 */
export function convertFromAssistantUI(message: AppendMessage | ThreadMessage): ChatMessage {
  const textContent = (message.content || [])
    .filter((c) => c.type === 'text')
    .map((c) => (c as { text: string }).text)
    .join('')

  return {
    id: ('id' in message ? message.id : `msg-${Date.now()}`) || `msg-${Date.now()}`,
    role: message.role as 'user' | 'assistant',
    content: textContent || '',
    timestamp: ('createdAt' in message ? message.createdAt : new Date()) || new Date(),
    metadata: ('metadata' in message && message.metadata?.custom) ? message.metadata.custom as ChatMessage['metadata'] : undefined
  }
}

/**
 * Convert conversation history to API format
 * @param messages - Array of ThreadMessage or ChatMessage
 * @returns Array of simplified message objects for API
 */
export function convertHistoryToAPI(messages: ThreadMessage[]): Array<{ role: string; content: string }> {
  return messages.map((msg) => {
    const chatMsg = convertFromAssistantUI(msg)
    return {
      role: chatMsg.role,
      content: chatMsg.content || '',
    }
  })
}

/**
 * Generate unique message ID
 * @param prefix - Optional prefix for the ID
 * @returns Unique message ID
 */
export function generateMessageId(prefix = 'msg'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Create error message
 * @param errorMessage - Error message content
 * @param error - Optional error object for additional context
 * @returns ChatMessage with error content
 */
export function createErrorMessage(errorMessage: string, error?: Error): ChatMessage {
  const errorContent = error 
    ? `❌ ${errorMessage}: ${error.message || 'Unknown error'}. Please try again.`
    : `❌ ${errorMessage}`

  return {
    id: generateMessageId('msg-error'),
    role: 'assistant',
    content: errorContent,
    timestamp: new Date(),
  }
}