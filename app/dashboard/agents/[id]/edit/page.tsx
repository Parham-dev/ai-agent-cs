'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/layout'
import { AgentCreationWizard, type AgentFormData } from '@/components/agents/agent-creation-wizard'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bot } from 'lucide-react'
import type { ApiAgent } from '@/lib/types'

export default function EditAgentPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [agent, setAgent] = useState<ApiAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const agentData = await apiClient.getAgent(agentId)
      setAgent(agentData)
    } catch (err) {
      console.error('Failed to fetch agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch agent')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  const handleSave = async (data: AgentFormData) => {
    try {
      const updatedAgent = await apiClient.updateAgent(agentId, {
        name: data.name,
        description: data.description,
        systemPrompt: data.instructions,
        model: data.model,
        temperature: data.temperature,
        maxTokens: 4000,
        isActive: data.isActive,
        rules: {
          behavior: {
            temperature: data.temperature,
            topP: data.topP,
            toolChoice: data.toolChoice,
            outputType: data.outputType
          },
          tools: {
            selectedTools: data.selectedTools,
            customTools: data.customTools
          },
          integrations: data.integrationConfigurations?.map(config => ({
            id: config.id,
            selectedTools: config.selectedTools || [],
            settings: config.settings || {}
          })) || [],
          guardrails: data.guardrails
        }
      })

      toast.success('Agent updated successfully!')
      router.push(`/dashboard/agents/${updatedAgent.id}`)
    } catch (error) {
      console.error('Failed to update agent:', error)
      toast.error('Failed to update agent. Please try again.')
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/agents/${agentId}`)
  }

  useEffect(() => {
    if (agentId) {
      fetchAgent()
    }
  }, [agentId, fetchAgent])

  if (loading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Fetching agent details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !agent) {
    return (
      <DashboardLayout title="Error" subtitle="Failed to load agent">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Bot className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Agent not found</h3>
            <p className="text-muted-foreground">{error || 'The requested agent could not be found.'}</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/agents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  // Convert agent data to form data format
  const initialFormData: Partial<AgentFormData> = {
    name: agent.name,
    description: agent.description || '',
    organizationId: agent.organizationId,
    instructions: agent.systemPrompt || '',
    model: agent.model,
    selectedTools: [],
    isActive: agent.isActive,
    temperature: agent.temperature || 1,
    topP: 1,
    toolChoice: 'auto',
    outputType: 'text',
    enabledIntegrations: [],
    customTools: [],
    handoffs: [],
    guardrails: { input: [], output: [] }
  }

  return (
    <DashboardLayout 
      title={`Edit ${agent.name}`} 
      subtitle="Update your agent configuration and settings"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/agents/${agent.id}`} className="inline-flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Agent</span>
            </Link>
          </Button>
        </div>

        <AgentCreationWizard
          organizationId={agent.organizationId}
          initialData={initialFormData}
          mode="edit"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  )
}
