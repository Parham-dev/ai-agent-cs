'use client'

import {
  Modal,
  Stack,
  Title,
  Text,
  Card,
  Group,
  Button,
  Badge,
} from '@mantine/core'
import { Calculator, Search, Brain } from 'lucide-react'
import { toast } from 'sonner'
import { AVAILABLE_TOOLS, type ToolConfig } from '@/lib/tools'

interface AddToolModalProps {
  opened: boolean
  onClose: () => void
  onToolAdded: (toolId: string) => void
  selectedToolIds: string[]
}

function getToolIcon(category: string) {
  switch (category) {
    case 'calculation':
      return Calculator
    case 'search':
      return Search
    case 'memory':
      return Brain
    default:
      return Calculator
  }
}

function getToolColors(type: string) {
  switch (type) {
    case 'openai':
      return {
        color: 'green',
        bg: 'bg-green-50',
        hover: 'hover:bg-green-100'
      }
    case 'custom':
      return {
        color: 'blue',
        bg: 'bg-blue-50', 
        hover: 'hover:bg-blue-100'
      }
    default:
      return {
        color: 'gray',
        bg: 'bg-gray-50',
        hover: 'hover:bg-gray-100'
      }
  }
}

export function AddToolModal({
  opened,
  onClose,
  onToolAdded,
  selectedToolIds
}: AddToolModalProps) {
  const availableTools = AVAILABLE_TOOLS.filter(tool => 
    tool.enabled && !selectedToolIds.includes(tool.id)
  )

  const handleSelectTool = (tool: ToolConfig) => {
    toast.success(`${tool.name} tool added`)
    onToolAdded(tool.id)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Stack gap={0}>
          <Title order={3}>Add Tool</Title>
          <Text size="sm" c="dimmed">Choose a tool to add to your agent</Text>
        </Stack>
      }
      size="md"
    >
      <Stack gap="md">
        {availableTools.length === 0 ? (
          <Card withBorder p="md">
            <Text c="dimmed" ta="center">
              All available tools are already added
            </Text>
          </Card>
        ) : (
          availableTools.map((tool) => {
            const Icon = getToolIcon(tool.category)
            const colors = getToolColors(tool.type)
            
            return (
              <Card
                key={tool.id}
                withBorder
                p="md"
                className={`cursor-pointer transition-all ${colors.hover}`}
                onClick={() => handleSelectTool(tool)}
              >
                <Group gap="md">
                  <Icon size={32} />
                  <Stack gap={2} flex={1}>
                    <Group gap="xs">
                      <Text fw={500}>{tool.name}</Text>
                      <Badge size="xs" color={colors.color} variant="light">
                        {tool.type}
                      </Badge>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {tool.description}
                    </Text>
                  </Stack>
                  <Button variant="light" size="sm">
                    Add
                  </Button>
                </Group>
              </Card>
            )
          })
        )}

        <Group justify="flex-end" pt="md">
          <Button
            variant="subtle"
            onClick={onClose}
          >
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}