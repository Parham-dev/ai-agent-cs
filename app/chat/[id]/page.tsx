'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, Activity } from 'lucide-react'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { Thread } from '@/components/assistant-ui/thread'
import { apiClient } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAgentChatRuntime } from '@/lib/assistant-ui/runtime'
import { DashboardLayout } from '@/components/dashboard/layout'
import type { ApiAgent } from '@/lib/types'


export default function AgentChatPage() {
  const params = useParams()
  const agentId = params.id as string

  console.log('🔥 AgentChatPage render - agentId:', agentId)

  // State
  const [agent, setAgent] = useState<ApiAgent | null>(null)
  const [agentLoading, setAgentLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('🔥 Current state:', { agent: agent?.name, agentLoading, error })

  // Initialize assistant-ui runtime
  console.log('🔥 Creating runtime with agent:', agent?.name)
  const { runtime, initializeChat } = useAgentChatRuntime(agent)
  console.log('🔥 Runtime created:', { runtime, initializeChat })

  // Load agent data
  const fetchAgent = useCallback(async () => {
    try {
      console.log('🔥 fetchAgent called for agentId:', agentId)
      setAgentLoading(true)
      setError(null)
      console.log('🔥 Calling apiClient.getAgent...')
      const agentData = await apiClient.getAgent(agentId)
      console.log('🔥 Agent data received:', agentData)
      setAgent(agentData)
      console.log('🔥 Agent state updated')
    } catch (err) {
      console.error('🔥 Failed to fetch agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to load agent')
    } finally {
      console.log('🔥 fetchAgent finally block')
      setAgentLoading(false)
    }
  }, [agentId])

  // Effects
  useEffect(() => {
    console.log('🔥 useEffect[agentId] triggered with:', agentId)
    if (agentId) {
      console.log('🔥 Calling fetchAgent...')
      fetchAgent()
    }
  }, [agentId, fetchAgent])

  // Initialize chat when agent loads
  useEffect(() => {
    console.log('🔥 useEffect[agent] triggered with:', agent?.name)
    if (agent) {
      console.log('🔥 Calling initializeChat...')
      initializeChat()
      console.log('🔥 initializeChat called')
    }
  }, [agent, initializeChat])

  if (agentLoading) {
    console.log('🔥 Rendering loading state')
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
    console.log('🔥 Rendering error state:', { error, agent })
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Agent not found</h3>
            <p className="text-muted-foreground">{error || 'The requested agent could not be found.'}</p>
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
      {/* Chat container that accounts for fixed footer */}
      <div className="flex flex-col h-full">
        {/* Sticky Header */}
        <div className="fixed top-20 left-0 right-0 z-50 bg-background/98 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="p-4 lg:ml-[280px]">
            <div className="max-w-4xl mx-auto">
              {/* Single Row Header */}
              <div className="flex items-center gap-4">
                {/* Left: Back button and Agent info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/agents" className="flex items-center gap-2 text-sm">
                      <ArrowLeft size={16} />
                      Back to Agents
                    </Link>
                  </Button>
                  
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                      <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    
                    <div className="flex items-center gap-3 min-w-0">
                      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
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
            </div>
          </div>
        </div>

        {/* Chat Interface - takes remaining space with top padding for sticky header */}
        <div className="flex-1 min-h-0 relative pt-16">
          <AssistantRuntimeProvider runtime={runtime}>
            <Thread />
          </AssistantRuntimeProvider>
        </div>
        
        {!agent.isActive && (
          <div className="fixed bottom-20 left-0 right-0 z-40 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
            <div className="p-3 lg:ml-[280px]">
              <div className="max-w-4xl mx-auto">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                  This agent is currently inactive. Please activate it to start chatting.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
