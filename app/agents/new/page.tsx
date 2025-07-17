'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/layout'
import { AgentCreationWizard, type AgentFormData } from '@/components/agents/agent-creation-wizard'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { createClientLogger } from '@/lib/utils/client-logger'

export default function NewAgentPage() {
  const router = useRouter()
  const logger = createClientLogger('NewAgentPage')

  const handleSave = async (data: AgentFormData) => {
    try {
      logger.info('Creating agent', {
        name: data.name,
        integrationsCount: data.integrationConfigurations?.length || 0,
        action: 'agent-creation'
      });

      // Create the agent using v2 API format
      const agent = await apiClient.createAgent({
        name: data.name,
        description: data.description,
        systemPrompt: data.instructions,
        model: data.model,
        temperature: data.temperature,
        maxTokens: 4000,
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

      // Create agent-integration relationships if there are any configured integrations
      if (data.integrationConfigurations && data.integrationConfigurations.length > 0) {
        logger.info('Creating agent-integration relationships', {
          agentId: agent.id,
          integrationsCount: data.integrationConfigurations.length
        });

        for (const config of data.integrationConfigurations) {
          try {
            await apiClient.createAgentIntegration({
              agentId: agent.id,
              integrationId: config.id,
              selectedTools: config.selectedTools || []
            });
            logger.info('Created agent-integration relationship', {
              agentId: agent.id,
              integrationId: config.id,
              toolsCount: config.selectedTools?.length || 0
            });
          } catch (integrationError) {
            logger.error('Failed to create agent-integration relationship', {
              agentId: agent.id,
              integrationId: config.id
            }, integrationError as Error);
            // Continue with other integrations even if one fails
          }
        }
      }

      logger.info('Agent created successfully', { 
        agentId: agent.id,
        integrationsCount: data.integrationConfigurations?.length || 0
      });

      toast.success('Agent created successfully!')
      router.push(`/agents/${agent.id}`)
    } catch (error) {
      logger.error('Failed to create agent', {}, error as Error)
      toast.error('Failed to create agent. Please try again.')
    }
  }


  return (
    <DashboardLayout 
      title="Create New Agent" 
      subtitle="Configure your AI agent with custom instructions, tools, and integrations"
    >
      <div className="space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/agents" className="inline-flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Agents</span>
            </Link>
          </Button>
        </div>

        <AgentCreationWizard
          onSave={handleSave}
        />
      </div>
    </DashboardLayout>
  )
}