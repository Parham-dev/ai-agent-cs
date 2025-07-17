'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, Activity, Brain } from 'lucide-react'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { Thread } from '@/components/assistant-ui/thread'
import { apiClient } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAgentChatRuntime } from '@/lib/assistant-ui/runtime'
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agents" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Agents</span>
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center space-x-3 bg-background rounded-lg px-4 py-2 shadow-md">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{agent.name}</p>
              <div className="flex items-center space-x-2">
                <Badge variant={agent.isActive ? "default" : "secondary"} className="text-xs">
                  {agent.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-muted-foreground">{agent.model}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-background rounded-xl shadow-lg flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg">{agent.name}</h1>
                <div className="flex items-center space-x-2 text-sm opacity-90">
                  <Activity className="w-4 h-4" />
                  <span>Ready to chat</span>
                  {agent.agentIntegrations && agent.agentIntegrations.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{agent.agentIntegrations.length} integrations connected</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Assistant UI Thread */}
          <div className="flex-1 overflow-hidden">
            {(() => {
              console.log('🔥 Rendering AssistantRuntimeProvider with runtime:', runtime)
              return null
            })()}
            <AssistantRuntimeProvider runtime={runtime}>
              {(() => {
                console.log('🔥 Rendering Thread component')
                return null
              })()}
              <Thread />
            </AssistantRuntimeProvider>
          </div>
          
          {!agent.isActive && (
            <div className="border-t bg-background p-4">
              <p className="text-xs text-muted-foreground text-center">
                This agent is currently inactive. Please activate it to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
