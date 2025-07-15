'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/layout'
import { AgentCreationWizard, type AgentFormData } from '@/components/agents/agent-creation-wizard'
import { agentsClient } from '@/lib/agents/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewAgentPage() {
  const router = useRouter()

  const handleSave = async (data: AgentFormData) => {
    try {
      const agent = await agentsClient.createAgent({
        organizationId: data.organizationId,
        name: data.name,
        instructions: data.instructions,
        tools: data.selectedTools,
        model: data.model,
        isActive: data.isActive
      })

      toast.success('Agent created successfully!')
      router.push(`/dashboard/agents/${agent.id}`)
    } catch (error) {
      console.error('Failed to create agent:', error)
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