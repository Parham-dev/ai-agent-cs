'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/layout'
import { AgentCreationWizard, type AgentFormData } from '@/components/agents/creation'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bot } from 'lucide-react'
import { useAgent } from '@/components/shared/hooks'

export default function EditAgentPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params?.id as string

  // Use SWR for agent data with automatic caching and error handling
  const { agent, isLoading: loading, error, refreshAgent } = useAgent(agentId)

  /**
   * Handle integration relationship updates
   * Compares current selections with existing relationships and creates/updates/deletes as needed
   */
  const handleIntegrationUpdates = async (
    agentId: string, 
    selectedIntegrations: Array<{integrationId: string; selectedTools: string[]; config?: Record<string, unknown>}>,
    existingIntegrations: Array<{integrationId: string; selectedTools?: string[]; config?: unknown}>
  ) => {
    // Create maps for efficient comparison
    const selectedMap = new Map(selectedIntegrations.map(s => [s.integrationId, s]))
    const existingMap = new Map(existingIntegrations.map(e => [e.integrationId, e]))

    // Handle deletions - integrations that exist but are no longer selected
    for (const [integrationId] of existingMap) {
      if (!selectedMap.has(integrationId)) {
        try {
          await fetch(`/api/v2/agent-integrations?agentId=${agentId}&integrationId=${integrationId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error(`Failed to delete integration ${integrationId}:`, error)
          // Continue with other operations even if one fails
        }
      }
    }

    // Handle creations and updates
    for (const [integrationId, selection] of selectedMap) {
      const existing = existingMap.get(integrationId)
      
      if (!existing) {
        // Create new relationship
        try {
          await api.agentIntegrations.createAgentIntegration({
            agentId,
            integrationId,
            selectedTools: selection.selectedTools || [],
            config: selection.config || {},
          })
        } catch (error) {
          console.error(`Failed to create integration ${integrationId}:`, error)
        }
      } else {
        // Update existing relationship if tools or config changed
        const toolsChanged = JSON.stringify(existing.selectedTools || []) !== JSON.stringify(selection.selectedTools || [])
        const configChanged = JSON.stringify(existing.config || {}) !== JSON.stringify(selection.config || {})
        
        if (toolsChanged || configChanged) {
          try {
            // Update existing relationship
            await api.agentIntegrations.updateAgentIntegration(agentId, integrationId, {
              selectedTools: selection.selectedTools || [],
              config: selection.config || {},
            })
          } catch (error) {
            console.error(`Failed to update integration ${integrationId}:`, error)
          }
        }
      }
    }
  }

  const handleSave = async (data: AgentFormData) => {
    try {
      const updatedAgent = await api.agents.updateAgent(agentId, {
        name: data.name,
        description: data.description,
        systemPrompt: data.systemPrompt,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        isActive: data.isActive,
        rules: data.rules,
        tools: data.selectedTools,
      })

      // Handle integration relationships
      if (data.selectedIntegrations && agent) {
        await handleIntegrationUpdates(agentId, data.selectedIntegrations, agent.agentIntegrations || [])
      }

      // Refresh SWR cache with updated data
      await refreshAgent()
      toast.success('Agent updated successfully!')
      router.push(`/agents/${updatedAgent.id}`)
    } catch (error) {
      console.error('Failed to update agent:', error)
      toast.error('Failed to update agent. Please try again.')
    }
  }

  const handleCancel = () => {
    router.push(`/agents/${agentId}`)
  }


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
            <p className="text-muted-foreground">{error instanceof Error ? error.message : error || 'The requested agent could not be found.'}</p>
          </div>
          <Button asChild>
            <Link href="/agents">
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
    systemPrompt: agent.systemPrompt || '',
    model: agent.model,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    isActive: agent.isActive,
    rules: {
      outputType: (agent.rules as Record<string, unknown>)?.outputType as 'text' | 'structured' || 'text',
      toolChoice: (agent.rules as Record<string, unknown>)?.toolChoice as 'auto' | 'required' | 'none' || 'auto',
      handoffs: (agent.rules as Record<string, unknown>)?.handoffs as string[] || [],
      guardrails: (agent.rules as Record<string, unknown>)?.guardrails as { input: string[], output: string[] } || { input: [], output: [] },
      customInstructions: (agent.rules as Record<string, unknown>)?.customInstructions as string[] || []
    },
    selectedIntegrations: agent.agentIntegrations?.map(ai => ({
      integrationId: ai.integrationId,
      selectedTools: ai.selectedTools || [],
      config: ai.config || {}
    })) || [],
    availableTools: agent.tools || [],
    selectedTools: agent.tools || [],
  }

  return (
    <DashboardLayout 
      title={`Edit ${agent.name}`} 
      subtitle="Update your agent configuration and settings"
    >
      <AgentCreationWizard
        initialData={initialFormData}
        mode="edit"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </DashboardLayout>
  )
}
