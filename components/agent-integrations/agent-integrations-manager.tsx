/**
 * Agent Integrations Manager Component
 * Manages the integrations connected to a specific agent
 * 
 * Updated to use Mantine components for consistency with the new design system
 */

'use client'

import React from 'react'
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
import { useIntegrations } from '@/components/shared/integrations'
import { useAgentIntegrations } from '@/components/shared/hooks'

interface AgentIntegrationsManagerProps {
  agentId: string
}

export function AgentIntegrationsManager({ agentId }: AgentIntegrationsManagerProps) {
  // Use SWR hooks for data fetching and caching
  const { allIntegrations: integrations, isLoading: integrationsLoading } = useIntegrations()
  const { 
    isLoading: agentIntegrationsLoading, 
    isIntegrationConnected, 
    getAgentIntegration 
  } = useAgentIntegrations(agentId)

  const loading = integrationsLoading || agentIntegrationsLoading

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