'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, Activity } from 'lucide-react'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { ChatThread } from '@/components/assistant-ui/chat-thread'
import { ThreadListSidebar } from '@/components/assistant-ui/thread-list-sidebar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAgentChatRuntimeWithThreadList } from '@/lib/assistant-ui/runtime'
import { DashboardLayout } from '@/components/dashboard/layout'
import { useAgent } from '@/components/shared/hooks'
import { renderError } from '@/lib/utils/error'
import { useAuthContext } from '@/components/providers/auth-provider'
import { generateMessageId } from '@/lib/assistant-ui/message-converter'


export default function AgentChatPage() {
  const params = useParams()
  const agentId = params?.id as string

  // Check authentication
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  // Use SWR for agent data with automatic caching and error handling
  const { agent, isLoading: agentLoading, error } = useAgent(agentId)


  // Initialize assistant-ui runtime with thread list support (always call hooks)
  // Pass agent even if null - the runtime will handle the null case
  const { runtime, setMessages, initializeChat } = useAgentChatRuntimeWithThreadList(agent || null)
  
  // Handle thread selection from sidebar - must be defined before early returns
  const handleThreadSelect = React.useCallback(async (_sessionId: string, conversationId: string) => {
    if (!agent) return
    
    try {
      // Fetch conversation messages from the database
      const response = await fetch(`/api/v2/conversations/${conversationId}/messages`)
      
      if (!response.ok) {
        throw new Error(`Failed to load conversation: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data?.messages) {
        // Convert database messages to assistant-ui format using the same converter from runtime
        const threadMessages = data.data.messages.map((msg: { id: string; role: string; content: string; createdAt: string }) => ({
          id: msg.id,
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: [
            {
              type: 'text' as const,
              text: msg.content,
            },
          ],
          createdAt: new Date(msg.createdAt),
          metadata: { 
            custom: {}
          },
          status: { type: 'complete' as const, reason: 'stop' as const },
        } as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
        
        setMessages(threadMessages)
      } else {
        // If no messages, start with welcome message
        const welcomeMessage = {
          id: generateMessageId('welcome'),
          role: 'assistant' as const,
          content: [
            {
              type: 'text' as const,
              text: `👋 Hello! I'm **${agent.name}**.

${agent.systemPrompt || "I'm here to help you!"}

How can I help you today?`,
            },
          ],
          createdAt: new Date(),
          metadata: { 
            custom: {}
          },
          status: { type: 'complete' as const, reason: 'stop' as const },
        } as any // eslint-disable-line @typescript-eslint/no-explicit-any
        setMessages([welcomeMessage])
      }
      
    } catch (error) {
      console.error('Failed to load conversation:', error)
      // Show error message to user
      const errorMessage = {
        id: generateMessageId('error'),
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: '❌ Sorry, there was an error loading this conversation. Please try again.'
          }
        ],
        createdAt: new Date(),
        metadata: { 
          custom: {}
        },
        status: { type: 'complete' as const, reason: 'stop' as const },
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any
      setMessages([errorMessage])
    }
  }, [agent, setMessages])

  // Initialize chat when agent becomes available
  React.useEffect(() => {
    if (agent && runtime) {
      initializeChat()
    }
  }, [agent, runtime, initializeChat])

  // Handle authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Authentication Required</h3>
            <p className="text-muted-foreground">Please log in to access the chat interface.</p>
          </div>
          <Button asChild>
            <Link href="/auth/login">
              Log In
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (agentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agent... ({agentId})</p>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Agent not found</h3>
            <p className="text-muted-foreground">{renderError(error, 'The requested agent could not be found.')}</p>
          </div>
          <Button asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout 
      title={agent ? `Chat with ${agent.name}` : 'Agent Chat'}
      subtitle={agent ? agent.description || 'AI Customer Service Agent' : undefined}
      disableContentScrolling={true}
    >
      {/* Chat container with two-column layout inside DashboardLayout - fixed height */}
      <div className="flex h-full max-h-full overflow-hidden" data-chat-page>
        {/* Thread List Sidebar (left column within content area) */}
        {runtime ? (
          <AssistantRuntimeProvider runtime={runtime}>
            <ThreadListSidebar onThreadSelect={handleThreadSelect} />
          </AssistantRuntimeProvider>
        ) : (
          <div className="w-80 h-full max-h-full bg-background border-r border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            <p className="text-muted-foreground text-sm">Loading sessions...</p>
          </div>
        )}

        {/* Main Chat Area (right column within content area) */}
        <div className="flex-1 flex flex-col min-w-0 max-h-full overflow-hidden">
          {/* Chat Header */}
          <div className="bg-background border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/agents" className="flex items-center gap-2 text-sm">
                  <ArrowLeft size={16} />
                  Back to Agents
                </Link>
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {agent.name}
                  </h1>
                  <Badge variant={agent.isActive ? "default" : "secondary"} className="font-medium text-xs">
                    {agent.isActive ? "Active" : "Inactive"}
                  </Badge>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Model:</span>
                      <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                        {agent.model}
                      </code>
                    </div>
                    
                    {agent.agentIntegrations && agent.agentIntegrations.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Integrations:</span>
                        <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                          {agent.agentIntegrations.length} connected
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      <span>Ready to chat</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 min-h-0 max-h-full relative overflow-hidden">
            {runtime ? (
              <AssistantRuntimeProvider runtime={runtime}>
                <ChatThread agent={agent} />
              </AssistantRuntimeProvider>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading chat...</p>
              </div>
            )}
          </div>
          
          {!agent.isActive && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800 p-3 flex-shrink-0">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                This agent is currently inactive. Please activate it to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
