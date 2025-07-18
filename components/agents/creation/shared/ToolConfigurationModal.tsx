'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Title,
  Text,
  Checkbox,
  Button,
  Group,
  LoadingOverlay,
  Card,
  Badge,
  ScrollArea,
} from '@mantine/core'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/authenticated-client'
import type { ApiIntegration, IntegrationTool } from '@/lib/types'

interface ToolConfigurationModalProps {
  opened: boolean
  onClose: () => void
  integration: ApiIntegration
  selectedTools: string[]
  onToolsChanged: (tools: string[]) => void
}

export function ToolConfigurationModal({
  opened,
  onClose,
  integration,
  selectedTools,
  onToolsChanged
}: ToolConfigurationModalProps) {
  const [availableTools, setAvailableTools] = useState<IntegrationTool[]>([])
  const [loading, setLoading] = useState(false)
  const [localSelection, setLocalSelection] = useState<string[]>(selectedTools)

  // Load available tools when modal opens
  const loadAvailableTools = async () => {
    try {
      setLoading(true)
      const tools = await apiClient.getIntegrationTools()
      setAvailableTools(tools)
    } catch (error) {
      console.error('Failed to load tools:', error)
      toast.error('Failed to load available tools')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (opened) {
      loadAvailableTools()
      setLocalSelection(selectedTools)
    }
  }, [opened, selectedTools])

  const handleToolToggle = (toolName: string) => {
    setLocalSelection(current => 
      current.includes(toolName) 
        ? current.filter(name => name !== toolName)
        : [...current, toolName]
    )
  }

  const handleSave = () => {
    onToolsChanged(localSelection)
    toast.success(`Updated tools for ${integration.name}`)
    onClose()
  }

  const handleCancel = () => {
    setLocalSelection(selectedTools) // Reset to original selection
    onClose()
  }

  // Get display name for integration type
  const getIntegrationDisplayName = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title={
        <Stack gap={0}>
          <Title order={3}>Configure Tools</Title>
          <Text size="sm" c="dimmed">
            Select tools for {integration.name} ({getIntegrationDisplayName(integration.type)})
          </Text>
        </Stack>
      }
      size="md"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <LoadingOverlay visible={loading} />
      
      <Stack gap="md">
        {/* Selection Summary */}
        <Card withBorder p="sm">
          <Group justify="space-between">
            <Text size="sm" fw={500}>Selected Tools</Text>
            <Badge variant="light" color="blue">
              {localSelection.length} of {availableTools.length}
            </Badge>
          </Group>
        </Card>

        {/* Tools List */}
        <ScrollArea h={300}>
          <Stack gap="sm">
            {availableTools.length === 0 && !loading ? (
              <Card withBorder p="md">
                <Text c="dimmed" ta="center">
                  No tools available for this integration
                </Text>
              </Card>
            ) : (
              availableTools.map((tool) => (
                <Card
                  key={tool.name}
                  withBorder
                  p="sm"
                  className={`cursor-pointer transition-all ${
                    localSelection.includes(tool.name)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleToolToggle(tool.name)}
                >
                  <Group gap="sm">
                    <Checkbox
                      checked={localSelection.includes(tool.name)}
                      onChange={() => handleToolToggle(tool.name)}
                      size="sm"
                    />
                    <Stack gap={2} flex={1}>
                      <Text fw={500} size="sm">{tool.name}</Text>
                      {tool.description && (
                        <Text size="xs" c="dimmed">{tool.description}</Text>
                      )}
                    </Stack>
                  </Group>
                </Card>
              ))
            )}
          </Stack>
        </ScrollArea>

        {/* Actions */}
        <Group justify="flex-end" pt="md">
          <Button
            variant="subtle"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            Save Selection
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
