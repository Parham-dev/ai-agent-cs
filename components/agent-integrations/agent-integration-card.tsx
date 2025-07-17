/**
 * Agent Integration Card Component
 * Displays an integration that can be connected to an agent
 * Updated to use Mantine components for consistency
 */

'use client'

import { 
  Paper, 
  Title, 
  Text, 
  Badge, 
  Group, 
  Stack, 
  Box,
  ThemeIcon
} from '@mantine/core'
import type { ApiIntegration, ApiAgentIntegration } from '@/lib/types'

interface AgentIntegrationCardProps {
  integration: ApiIntegration
  agentIntegration?: ApiAgentIntegration
  isConnected: boolean
}

export function AgentIntegrationCard({
  integration,
  agentIntegration,
  isConnected
}: AgentIntegrationCardProps) {
  const selectedToolsCount = agentIntegration?.selectedTools?.length || 0

  return (
    <Paper 
      withBorder 
      radius="lg" 
      p="lg"
      bg={isConnected ? "var(--mantine-color-green-light-hover)" : undefined}
      style={{ 
        transition: 'all 200ms ease',
        borderColor: isConnected ? 'var(--mantine-color-green-6)' : undefined
      }}
    >
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="md">
            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'purple' }}>
              <Text size="sm" fw={700} c="white">
                {integration.type.charAt(0).toUpperCase()}
              </Text>
            </ThemeIcon>
            <Box>
              <Title order={5} fw={600}>{integration.name}</Title>
              <Text size="sm" c="dimmed">
                {integration.type} integration
              </Text>
            </Box>
          </Group>
          
          <Group gap="sm">
            <Badge 
              variant={integration.isActive ? 'light' : 'outline'} 
              color={integration.isActive ? 'green' : 'gray'}
              radius="md"
            >
              {integration.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </Group>
        </Group>

        {isConnected && (
          <Stack gap="md">
            <Group gap="sm">
              <Text size="sm" c="dimmed">Tools configured:</Text>
              <Badge variant="outline" radius="md">{selectedToolsCount}</Badge>
            </Group>
            
            {agentIntegration?.selectedTools && agentIntegration.selectedTools.length > 0 && (
              <Box>
                <Text size="sm" c="dimmed" mb="xs">Selected Tools:</Text>
                <Group gap="xs">
                  {agentIntegration.selectedTools.map(tool => (
                    <Badge key={tool} variant="light" size="sm" radius="md">
                      {tool}
                    </Badge>
                  ))}
                </Group>
              </Box>
            )}
          </Stack>
        )}

        {!isConnected && integration.description && (
          <Text size="sm" c="dimmed">
            {integration.description}
          </Text>
        )}
      </Stack>
    </Paper>
  )
}