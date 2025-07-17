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
  Stack, 
  Center, 
  Loader,
  ThemeIcon,
  SimpleGrid
} from '@mantine/core'
import { Plus } from 'lucide-react'
import { AgentIntegrationCard } from './agent-integration-card'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import type { ApiIntegration, ApiAgentIntegration } from '@/lib/types'

interface AgentIntegrationsManagerProps {
  agentId: string
}

export function AgentIntegrationsManager({ agentId }: AgentIntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([])
  const [agentIntegrations, setAgentIntegrations] = useState<ApiAgentIntegration[]>([])
  const [loading, setLoading] = useState(true)


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





  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isIntegrationConnected = (integrationId: string) => {
    return agentIntegrations.some(ai => ai.integrationId === integrationId)
  }

  const getAgentIntegration = (integrationId: string) => {
    return agentIntegrations.find(ai => ai.integrationId === integrationId)
  }

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    )
  }

  return (
    <Stack gap="xl">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {integrations.map((integration) => (
          <AgentIntegrationCard
            key={integration.id}
            integration={integration}
            agentIntegration={getAgentIntegration(integration.id)}
            isConnected={isIntegrationConnected(integration.id)}
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


    </Stack>
  )
}