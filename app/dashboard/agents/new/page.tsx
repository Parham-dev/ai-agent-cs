'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/layout'
import { AgentCreationWizard, type AgentFormData } from '@/components/agents/agent-creation-wizard'
import { agentsClient } from '@/lib/agents/client'
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

      // 1. Create the agent first
      const agent = await agentsClient.createAgent({
        organizationId: data.organizationId,
        name: data.name,
        instructions: data.instructions,
        tools: data.selectedTools,
        model: data.model,
        isActive: data.isActive,
        agentConfig: {
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
          guardrails: data.guardrails
        }
      })

      logger.info('Agent created successfully', { agentId: agent.id });

      // 2. Create integrations for this agent
      if (data.integrationConfigurations && data.integrationConfigurations.length > 0) {
        logger.info('Creating integrations', { integrationsCount: data.integrationConfigurations.length });
        
        for (const integrationConfig of data.integrationConfigurations) {
          logger.debug('Creating integration', { 
            name: integrationConfig.name, 
            type: integrationConfig.type 
          });
          
          const response = await fetch('/api/integrations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              organizationId: data.organizationId,
              agentId: agent.id, // Link to the created agent
              type: integrationConfig.type || integrationConfig.id, // Use type or fallback to id
              name: integrationConfig.name,
              credentials: integrationConfig.credentials,
              settings: integrationConfig.settings || {},
              isActive: true
            })
          })
          
          const result = await response.json();
          logger.debug('Integration creation result', { result });
          
          if (!response.ok) {
            throw new Error(`Failed to create integration: ${result.error?.message || 'Unknown error'}`);
          }
        }
        
        logger.info('All integrations created successfully');
      } else {
        logger.debug('No integrations to create');
      }

      toast.success('Agent created successfully!')
      router.push(`/dashboard/agents/${agent.id}`)
    } catch (error) {
      logger.error('Failed to create agent', {}, error as Error)
      toast.error('Failed to create agent. Please try again.')
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/agents')
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
            <Link href="/dashboard/agents" className="inline-flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Agents</span>
            </Link>
          </Button>
        </div>

        <AgentCreationWizard
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  )
}