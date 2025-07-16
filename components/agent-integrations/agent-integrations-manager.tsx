/**
 * Agent Integrations Manager Component
 * Manages the integrations connected to a specific agent
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import { AgentIntegrationCard } from './agent-integration-card'
import { ToolSelectionDialog } from './tool-selection-dialog'
import { agentIntegrationsClient } from '@/lib/agent-integrations/client'
import { integrationsClient } from '@/lib/integrations/client'
import { toast } from 'sonner'
import type { Integration, AgentIntegration } from '@/lib/api/types'

interface AgentIntegrationsManagerProps {
  agentId: string
  agentName: string
}

export function AgentIntegrationsManager({ agentId, agentName }: AgentIntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [agentIntegrations, setAgentIntegrations] = useState<AgentIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [integrationsData, agentIntegrationsData] = await Promise.all([
        integrationsClient.getIntegrations({ isActive: true }),
        agentIntegrationsClient.getAgentIntegrations(agentId)
      ])
      
      setIntegrations(integrationsData)
      setAgentIntegrations(agentIntegrationsData)
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
      toast.error('Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleToggleConnection = async (integrationId: string, connect: boolean) => {
    try {
      if (connect) {
        // Connect with no tools initially - user can configure later
        await agentIntegrationsClient.connectAgentToIntegration({
          agentId,
          integrationId,
          selectedTools: []
        })
        toast.success('Integration connected successfully')
      } else {
        await agentIntegrationsClient.disconnectAgentFromIntegration(agentId, integrationId)
        toast.success('Integration disconnected successfully')
      }
      
      // Refresh agent integrations
      const updatedAgentIntegrations = await agentIntegrationsClient.getAgentIntegrations(agentId)
      setAgentIntegrations(updatedAgentIntegrations)
    } catch (error) {
      console.error('Failed to toggle integration:', error)
      toast.error('Failed to update integration connection')
    }
  }

  const handleConfigureTools = (integrationId: string) => {
    setSelectedIntegrationId(integrationId)
  }

  const handleToolsConfigured = async (integrationId: string, selectedTools: string[]) => {
    try {
      await agentIntegrationsClient.updateAgentIntegrationTools(agentId, integrationId, selectedTools)
      toast.success('Tools configured successfully')
      
      // Refresh agent integrations
      const updatedAgentIntegrations = await agentIntegrationsClient.getAgentIntegrations(agentId)
      setAgentIntegrations(updatedAgentIntegrations)
    } catch (error) {
      console.error('Failed to configure tools:', error)
      toast.error('Failed to configure tools')
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isIntegrationConnected = (integrationId: string) => {
    return agentIntegrations.some(ai => ai.integrationId === integrationId)
  }

  const getAgentIntegration = (integrationId: string) => {
    return agentIntegrations.find(ai => ai.integrationId === integrationId)
  }

  const connectedCount = agentIntegrations.length
  const availableCount = integrations.length

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agent Integrations</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage integrations for {agentName}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{connectedCount}</div>
              <div className="text-sm text-muted-foreground">Connected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">{availableCount}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {agentIntegrations.reduce((sum, ai) => sum + (ai.selectedTools?.length || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Tools</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <AgentIntegrationCard
            key={integration.id}
            integration={integration}
            agentIntegration={getAgentIntegration(integration.id)}
            isConnected={isIntegrationConnected(integration.id)}
            onToggleConnection={handleToggleConnection}
            onConfigureTools={handleConfigureTools}
            loading={loading}
          />
        ))}
      </div>

      {integrations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No integrations available</h3>
            <p className="text-muted-foreground">
              Create integrations at the organization level to connect them to agents.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedIntegrationId && (
        <ToolSelectionDialog
          integrationId={selectedIntegrationId}
          currentTools={getAgentIntegration(selectedIntegrationId)?.selectedTools || []}
          onSave={handleToolsConfigured}
          onClose={() => setSelectedIntegrationId(null)}
        />
      )}
    </div>
  )
}