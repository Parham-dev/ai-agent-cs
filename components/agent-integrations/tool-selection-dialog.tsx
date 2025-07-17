/**
 * Tool Selection Dialog Component
 * Allows users to select which tools from an integration an agent can use
 * Updated to use Mantine components for consistency
 */

'use client'

import { useState, useEffect } from 'react'
import { 
  Modal,
  Button, 
  Badge, 
  Paper, 
  Text,
  Title,
  Group,
  Stack,
  Box,
  Checkbox,
  Loader,
  Center,
  ThemeIcon
} from '@mantine/core'
import { Wrench } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import type { IntegrationTool } from '@/lib/types'

interface ToolSelectionDialogProps {
  integrationId: string
  currentTools: string[]
  onSave: (integrationId: string, selectedTools: string[]) => Promise<void>
  onClose: () => void
}

export function ToolSelectionDialog({
  integrationId,
  currentTools,
  onSave,
  onClose
}: ToolSelectionDialogProps) {
  const [availableTools, setAvailableTools] = useState<IntegrationTool[]>([])
  const [selectedTools, setSelectedTools] = useState<string[]>(currentTools)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [integrationType, setIntegrationType] = useState<string>('')

  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true)
        
        // Get integration details to determine type
        const integration = await apiClient.getIntegration(integrationId)
        setIntegrationType(integration.type)
        
        // Get available tools for this integration type
        const tools = await apiClient.getIntegrationTools(integration.type)
        setAvailableTools(tools)
      } catch (error) {
        console.error('Failed to fetch tools:', error)
        toast.error('Failed to load available tools')
      } finally {
        setLoading(false)
      }
    }

    fetchTools()
  }, [integrationId])

  const handleToolToggle = (toolName: string, checked: boolean) => {
    setSelectedTools(prev => 
      checked 
        ? [...prev, toolName]
        : prev.filter(name => name !== toolName)
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(integrationId, selectedTools)
      onClose()
    } catch (error) {
      console.error('Failed to save tools:', error)
      toast.error('Failed to save tool configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectAll = () => {
    setSelectedTools(availableTools.map(tool => tool.name))
  }

  const handleSelectNone = () => {
    setSelectedTools([])
  }

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon variant="light" color="blue">
            <Wrench size={18} />
          </ThemeIcon>
          <Title order={4}>Configure Tools</Title>
          <Badge variant="outline" radius="md">
            {integrationType}
          </Badge>
        </Group>
      }
      size="lg"
      radius="lg"
      centered
    >
      <Stack gap="lg">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Select which tools this agent can use from this integration
          </Text>
          <Group gap="sm">
            <Button
              variant="light"
              size="sm"
              onClick={handleSelectAll}
              disabled={loading}
              radius="md"
            >
              Select All
            </Button>
            <Button
              variant="light"
              size="sm"
              onClick={handleSelectNone}
              disabled={loading}
              radius="md"
            >
              Select None
            </Button>
          </Group>
        </Group>

        <Group gap="lg">
          <Group gap="sm">
            <Text size="sm" c="dimmed">Selected:</Text>
            <Badge variant="light" radius="md">{selectedTools.length}</Badge>
          </Group>
          <Group gap="sm">
            <Text size="sm" c="dimmed">Available:</Text>
            <Badge variant="outline" radius="md">{availableTools.length}</Badge>
          </Group>
        </Group>

        {loading ? (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        ) : (
          <Box style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Stack gap="md">
              {availableTools.map((tool) => (
                <Paper key={tool.name} withBorder p="md" radius="md">
                  <Group align="flex-start" gap="md">
                    <Checkbox
                      id={tool.name}
                      checked={selectedTools.includes(tool.name)}
                      onChange={(e) => 
                        handleToolToggle(tool.name, e.currentTarget.checked)
                      }
                      size="md"
                      style={{ marginTop: 2 }}
                    />
                    <Box flex={1}>
                      <Text fw={500} mb="xs">
                        {tool.name}
                      </Text>
                      <Text size="sm" c="dimmed" mb="sm">
                        {tool.description}
                      </Text>
                      {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                        <Box>
                          <Text size="xs" c="dimmed" mb="xs">Parameters:</Text>
                          <Group gap="xs">
                            {Object.keys(tool.parameters).map((param) => (
                              <Badge key={param} variant="outline" size="sm" radius="md">
                                {param}
                              </Badge>
                            ))}
                          </Group>
                        </Box>
                      )}
                    </Box>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {!loading && availableTools.length === 0 && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <ThemeIcon size="xl" variant="light" color="gray">
                <Wrench size={24} />
              </ThemeIcon>
              <Title order={4} ta="center">No tools available</Title>
              <Text ta="center" c="dimmed">
                This integration doesn&apos;t have any tools configured yet.
              </Text>
            </Stack>
          </Center>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={onClose} disabled={saving} radius="md">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} radius="md">
            {saving ? (
              <>
                <Loader size="sm" style={{ marginRight: 8 }} />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}