'use client'

import {
  Grid,
  Card,
  Stack,
  Group,
  Text,
  Switch,
  Badge,
  Button
} from '@mantine/core'
import { Settings, Wrench } from 'lucide-react'
import { getIntegrationIcon, getIntegrationColors, getIntegrationDisplayName } from './integration-utils'
import type { ApiIntegration } from '@/lib/types'

interface IntegrationCardProps {
  integration: ApiIntegration
  isSelected: boolean
  selectedToolsCount: number
  onToggle: (integration: ApiIntegration) => void
  onConfigureCredentials: (integration: ApiIntegration) => void
  onConfigureTools: (integration: ApiIntegration) => void
  // Context-specific props
  showToolsButton?: boolean
  showToolsCount?: boolean
  mode?: 'wizard' | 'management'
}

export function IntegrationCard({
  integration,
  isSelected,
  selectedToolsCount,
  onToggle,
  onConfigureCredentials,
  onConfigureTools,
  showToolsButton = true,
  showToolsCount = true
}: IntegrationCardProps) {
  const Icon = getIntegrationIcon(integration.type)
  const colors = getIntegrationColors(integration.type)
  const isTemporary = integration.id.startsWith('temp-')

  return (
    <Grid.Col span={6} key={integration.id}>
      <Card
        withBorder
        className={`transition-all cursor-pointer ${
          isSelected 
            ? colors.light
            : colors.hover
        }`}
        onClick={() => onToggle(integration)}
      >
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="sm">
              <Icon size={24} />
              <Stack gap={2}>
                <Text fw={500} size="sm">{integration.name}</Text>
                <Text size="xs" c="dimmed">{getIntegrationDisplayName(integration.type)} integration</Text>
              </Stack>
            </Group>
            
            <Switch
              checked={isSelected}
              onChange={() => onToggle(integration)}
              size="sm"
              color="blue"
            />
          </Group>

          {isSelected && (
            <Group justify="space-between" pt="xs">
              {showToolsCount && (
                <Group gap="xs">
                  <Text size="xs" c="dimmed">Tools selected:</Text>
                  <Badge size="xs" variant="outline">
                    {selectedToolsCount}
                  </Badge>
                </Group>
              )}
              
              <Group gap="xs" style={{ marginLeft: showToolsCount ? 'auto' : 0 }}>
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<Settings size={14} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    onConfigureCredentials(integration)
                  }}
                >
                  Settings
                </Button>
                
                {showToolsButton && (
                  <Button
                    variant="subtle"
                    size="xs"
                    leftSection={<Wrench size={14} />}
                    onClick={(e) => {
                      e.stopPropagation()
                      onConfigureTools(integration)
                    }}
                    disabled={isTemporary}
                    title={
                      isTemporary 
                        ? "Configure credentials first to enable tool selection" 
                        : "Configure tools for this integration"
                    }
                  >
                    Tools
                  </Button>
                )}
              </Group>
            </Group>
          )}
        </Stack>
      </Card>
    </Grid.Col>
  )
}
