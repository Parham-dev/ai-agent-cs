'use client'

import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/layout'
import { AgentCreationWizard, type AgentFormData } from '@/components/agents/creation'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { createClientLogger } from '@/lib/utils/client-logger'
import { mutate } from 'swr'

export default function NewAgentPage() {
  const router = useRouter()
  const logger = createClientLogger('NewAgentPage')

  const handleSave = async (data: AgentFormData) => {
    try {
      logger.info('Creating agent', {
        name: data.name,
        integrationsCount: data.selectedIntegrations?.length || 0,
        action: 'agent-creation'
      });

      // Create the agent using v2 API - organization scoping handled by server
      console.log('🔨 Creating agent with data:', {
        name: data.name,
        model: data.model,
        hasSystemPrompt: !!data.systemPrompt,
        temperature: data.temperature,
        maxTokens: data.maxTokens
      })
      
      const agent = await api.agents.createAgent({
        name: data.name,
        description: data.description,
        systemPrompt: data.systemPrompt,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        rules: data.rules,
        tools: data.selectedTools || []
      })
      
      console.log('✅ Agent created successfully:', {
        id: agent.id,
        name: agent.name,
        model: agent.model,
        isActive: agent.isActive
      })

      // Create agent-integration relationships if there are any configured integrations
      if (data.selectedIntegrations && data.selectedIntegrations.length > 0) {
        logger.info('Creating agent-integration relationships', {
          agentId: agent.id,
          integrationsCount: data.selectedIntegrations.length
        });

        for (const integration of data.selectedIntegrations) {
          try {
            await api.agentIntegrations.createAgentIntegration({
              agentId: agent.id,
              integrationId: integration.integrationId,
              selectedTools: integration.selectedTools || []
            });
            logger.info('Created agent-integration relationship', {
              agentId: agent.id,
              integrationId: integration.integrationId,
              toolsCount: integration.selectedTools?.length || 0
            });
          } catch (integrationError) {
            logger.error('Failed to create agent-integration relationship', {
              agentId: agent.id,
              integrationId: integration.integrationId
            }, integrationError as Error);
            // Continue with other integrations even if one fails
          }
        }
      }

      logger.info('Agent created successfully', { 
        agentId: agent.id,
        integrationsCount: data.selectedIntegrations?.length || 0
      });

      toast.success('Agent created successfully!')
      
      // Invalidate agents list cache to show new agent immediately
      await mutate(key => typeof key === 'string' && key.startsWith('agents'))
      
      // Small delay to ensure SWR cache updates before redirect
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('🔄 Redirecting to agent page:', `/agents/${agent.id}`)
      router.push(`/agents/${agent.id}`)
    } catch (error) {
      logger.error('Failed to create agent', {}, error as Error)
      toast.error('Failed to create agent. Please try again.')
    }
  }


  const handleCancel = () => {
    router.push('/agents')
  }

  return (
    <DashboardLayout 
      title="Create New Agent" 
      subtitle="Configure your AI agent with custom instructions, tools, and integrations"
    >
      <AgentCreationWizard
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </DashboardLayout>
  )
}