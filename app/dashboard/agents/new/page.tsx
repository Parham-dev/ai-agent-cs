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

      // 1. Create the agent with integration IDs in agentConfig
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
          integrations: data.integrationConfigurations?.map(config => ({
            id: config.id, // Store only the integration ID
            selectedTools: config.selectedTools || [],
            settings: config.settings || {}
          })) || [],
          guardrails: data.guardrails
        }
      })

      logger.info('Agent created successfully', { 
        agentId: agent.id,
        integrationsCount: data.integrationConfigurations?.length || 0
      });

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