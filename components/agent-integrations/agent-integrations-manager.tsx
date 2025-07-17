/**
 * Agent Integrations Manager Component
 * Manages the integrations connected to a specific agent
 * 
 * Updated to use Mantine components for consistency with the new design system
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Paper, 
  Title, 
  Text, 
  Button, 
  Group, 
  Stack, 
  Center, 
  Loader,
  ThemeIcon,
  Box,
  SimpleGrid
} from '@mantine/core'
import { Plus, RefreshCw } from 'lucide-react'
import { AgentIntegrationCard } from './agent-integration-card'
import { ToolSelectionDialog } from './tool-selection-dialog'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import type { ApiIntegration, ApiAgentIntegration } from '@/lib/types'

interface AgentIntegrationsManagerProps {
  agentId: string
  agentName: string
}

export function AgentIntegrationsManager({ agentId, agentName }: AgentIntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([])
  const [agentIntegrations, setAgentIntegrations] = useState<ApiAgentIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [integrationsData, agentIntegrationsData] = await Promise.all([
        apiClient.getIntegrations({ isActive: true }),
        apiClient.getAgentIntegrations(agentId)
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
        await apiClient.createAgentIntegration({
          agentId,
          integrationId,
          selectedTools: []
        })
        toast.success('Integration connected successfully')
      } else {
        await apiClient.deleteAgentIntegration(agentId, integrationId)
        toast.success('Integration disconnected successfully')
      }
      
      // Refresh agent integrations
      const updatedAgentIntegrations = await apiClient.getAgentIntegrations(agentId)
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
      // Since updateAgentIntegrationTools doesn't exist in apiClient,
      // we need to disconnect and reconnect with the new tools
      await apiClient.deleteAgentIntegration(agentId, integrationId)
      await apiClient.createAgentIntegration({
        agentId,
        integrationId,
        selectedTools
      })
      toast.success('Tools configured successfully')
      
      // Refresh agent integrations
      const updatedAgentIntegrations = await apiClient.getAgentIntegrations(agentId)
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
      <Paper withBorder radius="lg" p="xl">
        <Group gap="md" mb="lg">
          <Title order={4} fw={600}>Agent Integrations</Title>
        </Group>
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Paper>
    )
  }

  return (
    <Stack gap="xl">
      <Paper withBorder radius="lg" p="xl">
        <Group justify="space-between" mb="lg">
          <Box>
            <Title order={4} fw={600}>Agent Integrations</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Manage integrations for {agentName}
            </Text>
          </Box>
          <Button
            variant="light"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            leftSection={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}
            radius="md"
          >
            Refresh
          </Button>
        </Group>
        
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          <Paper bg="var(--mantine-color-blue-light-hover)" p="md" radius="md" withBorder>
            <Text ta="center" size="xl" fw={700} c="blue.6">{connectedCount}</Text>
            <Text ta="center" size="sm" c="dimmed">Connected</Text>
          </Paper>
          <Paper bg="var(--mantine-color-default-hover)" p="md" radius="md" withBorder>
            <Text ta="center" size="xl" fw={700} c="var(--mantine-color-text)">{availableCount}</Text>
            <Text ta="center" size="sm" c="dimmed">Available</Text>
          </Paper>
          <Paper bg="var(--mantine-color-green-light-hover)" p="md" radius="md" withBorder>
            <Text ta="center" size="xl" fw={700} c="green.6">
              {agentIntegrations.reduce((sum, ai) => sum + (ai.selectedTools?.length || 0), 0)}
            </Text>
            <Text ta="center" size="sm" c="dimmed">Total Tools</Text>
          </Paper>
        </SimpleGrid>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
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
      </SimpleGrid>

      {integrations.length === 0 && (
        <Paper withBorder radius="lg" p="xl">
          <Center py="xl">
            <Stack align="center" gap="md">
              <ThemeIcon size="xl" variant="light" color="gray">
                <Plus size={24} />
              </ThemeIcon>
              <Title order={4} ta="center">No integrations available</Title>
              <Text ta="center" c="dimmed">
                Create integrations at the organization level to connect them to agents.
              </Text>
            </Stack>
          </Center>
        </Paper>
      )}

      {selectedIntegrationId && (
        <ToolSelectionDialog
          integrationId={selectedIntegrationId}
          currentTools={getAgentIntegration(selectedIntegrationId)?.selectedTools || []}
          onSave={handleToolsConfigured}
          onClose={() => setSelectedIntegrationId(null)}
        />
      )}
    </Stack>
  )
}