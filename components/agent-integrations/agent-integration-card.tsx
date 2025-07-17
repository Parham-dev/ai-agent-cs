/**
 * Agent Integration Card Component
 * Displays an integration that can be connected to an agent
 * Updated to use Mantine components for consistency
 */

'use client'

import { useState } from 'react'
import { 
  Paper, 
  Title, 
  Text, 
  Button, 
  Badge, 
  Group, 
  Stack, 
  Box,
  Collapse,
  ThemeIcon,
  ActionIcon,
  Checkbox
} from '@mantine/core'
import { Settings, ChevronDown, ChevronUp } from 'lucide-react'
import type { ApiIntegration, ApiAgentIntegration } from '@/lib/types'

interface AgentIntegrationCardProps {
  integration: ApiIntegration
  agentIntegration?: ApiAgentIntegration
  isConnected: boolean
  onToggleConnection: (integrationId: string, connect: boolean) => Promise<void>
  onConfigureTools: (integrationId: string) => void
  loading?: boolean
}

export function AgentIntegrationCard({
  integration,
  agentIntegration,
  isConnected,
  onToggleConnection,
  onConfigureTools,
  loading = false
}: AgentIntegrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onToggleConnection(integration.id, !isConnected)
    } finally {
      setToggling(false)
    }
  }

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
            <Checkbox
              checked={isConnected}
              onChange={handleToggle}
              disabled={loading || toggling || !integration.isActive}
              size="md"
            />
          </Group>
        </Group>

        {isConnected && (
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="sm">
                <Text size="sm" c="dimmed">Tools configured:</Text>
                <Badge variant="outline" radius="md">{selectedToolsCount}</Badge>
              </Group>
              
              <Group gap="sm">
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => onConfigureTools(integration.id)}
                  disabled={loading}
                  leftSection={<Settings size={16} />}
                  radius="md"
                >
                  Configure Tools
                </Button>
                
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  radius="md"
                >
                  {isExpanded ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </ActionIcon>
              </Group>
            </Group>

            <Collapse in={isExpanded}>
              {agentIntegration && (
                <Paper bg="var(--mantine-color-default-hover)" p="md" radius="md" withBorder>
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Status:</Text>
                      <Badge 
                        variant={agentIntegration.isEnabled ? 'light' : 'outline'} 
                        color={agentIntegration.isEnabled ? 'green' : 'gray'}
                        radius="md"
                      >
                        {agentIntegration.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </Group>
                    
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Connected:</Text>
                      <Text size="sm">{new Date(agentIntegration.createdAt).toLocaleDateString()}</Text>
                    </Group>
                    
                    {agentIntegration.selectedTools && agentIntegration.selectedTools.length > 0 && (
                      <Box>
                        <Text size="sm" c="dimmed" mb="xs">Selected Tools:</Text>
                        <Group gap="xs">
                          {agentIntegration.selectedTools.map(tool => (
                            <Badge key={tool} variant="outline" size="sm" radius="md">
                              {tool}
                            </Badge>
                          ))}
                        </Group>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              )}
            </Collapse>
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