'use client'

import React, { FC } from 'react'
import { 
  ThreadListPrimitive
} from '@assistant-ui/react'
import { 
  Plus, 
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useParams } from 'next/navigation'

/**
 * ThreadList Sidebar Component
 * Provides session management UI for multi-turn conversations
 */
interface ThreadListSidebarProps {
  onThreadSelect?: (sessionId: string, conversationId: string) => void
}

export const ThreadListSidebar: FC<ThreadListSidebarProps> = ({ onThreadSelect }) => {
  return (
    <div className="w-80 h-full max-h-full bg-background border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      <ThreadListPrimitive.Root className="flex flex-col h-full max-h-full">
        {/* Header - aligned with chat area header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <ThreadListPrimitive.New>
                  <Plus className="h-4 w-4" />
                </ThreadListPrimitive.New>
              </Button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Chat Sessions
              </h2>
            </div>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide hover:scrollbar-show scroll-smooth">
          <ThreadListItems onThreadSelect={onThreadSelect} />
        </div>

        {/* Footer - aligned with chat area composer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0" style={{ height: '80px' }}>
          <ThreadListStats />
        </div>
      </ThreadListPrimitive.Root>
    </div>
  )
}


/**
 * New Chat Button styled as a session item (appears in the session list)
 */
const ThreadListNewItemButton: FC = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <div className="w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Plus className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Start New Chat
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Click to create a new conversation
              </span>
            </div>
          </div>
        </div>
      </div>
    </ThreadListPrimitive.New>
  )
}

/**
 * Thread List Items
 */
interface ThreadListItemsProps {
  onThreadSelect?: (sessionId: string, conversationId: string) => void
}

const ThreadListItems: FC<ThreadListItemsProps> = ({ onThreadSelect }) => {
  const [conversations, setConversations] = React.useState<Array<{ remoteId: string; externalId?: string; title?: string; createdAt: string }>>([])
  const [loading, setLoading] = React.useState(true)
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null)
  
  const params = useParams()
  const agentId = params?.id as string
  
  // Fetch conversations directly in this component
  React.useEffect(() => {
    const fetchConversations = async () => {
      try {
        // Fetch conversations for agent
        setLoading(true)
        
        const response = await fetch(`/api/v2/agents/${agentId}/conversations`)
        const data = await response.json()
        
        // Process fetched conversations
        
        if (data.success && data.data?.threads) {
          setConversations(data.data.threads)
          // Set conversations from response
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchConversations()
  }, [agentId])
  
  const handleThreadClick = (conversation: { remoteId: string; externalId?: string; title?: string; createdAt: string }) => {
    // Handle thread selection
    
    setActiveSessionId(conversation.remoteId)
    
    if (onThreadSelect) {
      onThreadSelect(conversation.remoteId, conversation.externalId || conversation.remoteId)
    }
  }
  
  if (loading) {
    return (
      <div className="p-2">
        <div className="text-center text-gray-500 text-sm">Loading conversations...</div>
      </div>
    )
  }
  
  return (
    <div className="p-2 space-y-1">
      {/* Show our custom conversation list */}
      {conversations.map((conversation) => {
        const isActive = activeSessionId === conversation.remoteId
        return (
          <div 
            key={conversation.remoteId} 
            onClick={() => handleThreadClick(conversation)}
            className={`w-full p-3 rounded-lg cursor-pointer transition-colors border ${
              isActive 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' 
                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg border flex-shrink-0 ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
              }`}>
                <MessageSquare className={`h-4 w-4 ${
                  isActive ? 'text-blue-700 dark:text-blue-300' : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-sm font-medium truncate ${
                    isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {conversation.title || 'Untitled Chat'}
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${
                    isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {conversation.createdAt ? new Date(conversation.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
      
      {conversations.length === 0 && (
        <div className="text-center text-gray-500 text-sm p-4">
          No conversations yet. Start chatting to see your conversation history here.
        </div>
      )}
      
      {/* New Chat Button as last item in the list */}
      <ThreadListNewItemButton />
    </div>
  )
}




/**
 * Thread List Statistics
 */
const ThreadListStats: FC = () => {
  // For now, show static stats since we need to implement the actual thread list state
  const totalThreads = 0 // Will be populated when thread list is working

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Chat Sessions</span>
        <Badge variant="secondary" className="text-xs">
          {totalThreads}
        </Badge>
      </div>
      
      <div className="text-xs text-gray-400 dark:text-gray-500">
        Conversations are organized by session
      </div>
    </div>
  )
}