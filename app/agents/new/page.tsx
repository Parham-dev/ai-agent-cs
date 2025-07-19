'use client'

import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/layout'
import { AgentCreationWizard, type AgentFormData } from '@/components/agents/creation'
import { apiClient } from '@/lib/api/client'
import { useAuthContext } from '@/components/providers'
import { toast } from 'sonner'
import { createClientLogger } from '@/lib/utils/client-logger'

export default function NewAgentPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const logger = createClientLogger('NewAgentPage')

  const handleSave = async (data: AgentFormData) => {
    try {
      if (!user?.organizationId) {
        toast.error('Organization ID not found. Please refresh and try again.')
        return
      }

      logger.info('Creating agent', {
        name: data.name,
        organizationId: user.organizationId,
        integrationsCount: data.selectedIntegrations?.length || 0,
        action: 'agent-creation'
      });

      // Create the agent using v2 API format with organization ID
      const agent = await apiClient.createAgent({
        name: data.name,
        description: data.description,
        systemPrompt: data.systemPrompt,
        model: data.model,
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        rules: data.rules,
        organizationId: user.organizationId,
        tools: data.selectedTools || []
      })

      // Create agent-integration relationships if there are any configured integrations
      if (data.selectedIntegrations && data.selectedIntegrations.length > 0) {
        logger.info('Creating agent-integration relationships', {
          agentId: agent.id,
          integrationsCount: data.selectedIntegrations.length
        });

        for (const integration of data.selectedIntegrations) {
          try {
            await apiClient.createAgentIntegration({
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