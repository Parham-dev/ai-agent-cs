'use client'

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


export default function AgentChatPage() {
  const params = useParams()
  const agentId = params?.id as string

  // Use SWR for agent data with automatic caching and error handling
  const { agent, isLoading: agentLoading, error } = useAgent(agentId)

  // Initialize assistant-ui runtime with thread list support (always call hooks)
  const { runtime } = useAgentChatRuntimeWithThreadList(agent || null)

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
    >
      {/* Chat container with two-column layout inside DashboardLayout */}
      <div className="flex h-full">
        {/* Thread List Sidebar (left column within content area) */}
        {runtime ? (
          <AssistantRuntimeProvider runtime={runtime}>
            <ThreadListSidebar />
          </AssistantRuntimeProvider>
        ) : (
          <div className="w-80 h-full bg-background border-r border-gray-200 dark:border-gray-700 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading sessions...</p>
          </div>
        )}

        {/* Main Chat Area (right column within content area) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="bg-background border-b border-gray-200 dark:border-gray-700 p-4">
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
          <div className="flex-1 min-h-0 relative">
            {runtime ? (
              <AssistantRuntimeProvider runtime={runtime}>
                <ChatThread />
              </AssistantRuntimeProvider>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading chat...</p>
              </div>
            )}
          </div>
          
          {!agent.isActive && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800 p-3">
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
