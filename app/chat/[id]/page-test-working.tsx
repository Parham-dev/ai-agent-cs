'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import type { ApiAgent } from '@/lib/types'

export default function AgentChatTestPage() {
  const params = useParams()
  const agentId = params.id as string

  const [agent, setAgent] = useState<ApiAgent | null>(null)
  const [agentLoading, setAgentLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgent = useCallback(async () => {
    try {
      console.log('Fetching agent:', agentId)
      setAgentLoading(true)
      setError(null)
      const agentData = await apiClient.getAgent(agentId)
      console.log('Agent data:', agentData)
      setAgent(agentData)
    } catch (err) {
      console.error('Failed to fetch agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to load agent')
    } finally {
      setAgentLoading(false)
    }
  }, [agentId])

  useEffect(() => {
    if (agentId) {
      fetchAgent()
    }
  }, [agentId, fetchAgent])

  console.log('Current state:', { agentLoading, agent, error })

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
        <div className="text-center">
          <h3 className="text-lg font-semibold">Agent not found</h3>
          <p className="text-muted-foreground">{error || 'Agent not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Page - Agent Loaded Successfully</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Agent: {agent.name}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">ID: {agent.id}</p>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Status: {agent.isActive ? 'Active' : 'Inactive'}</p>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Model: {agent.model}</p>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">System Prompt:</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">{agent.systemPrompt}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Integrations:</h3>
            <p className="text-gray-600 dark:text-gray-300">{agent.agentIntegrations?.length || 0} integrations</p>
          </div>
        </div>
      </div>
    </div>
  )
}