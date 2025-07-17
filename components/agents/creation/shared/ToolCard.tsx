'use client'

import {
  Card,
  Group,
  Text,
  Switch,
  Badge,
  Stack,
} from '@mantine/core'
import { Calculator, Search } from 'lucide-react'
import { AVAILABLE_TOOLS } from '@/lib/tools'

interface ToolCardProps {
  toolId: string
  isSelected: boolean
  onToggle: (toolId: string) => void
}

function getToolIcon(category: string) {
  switch (category) {
    case 'calculation':
      return Calculator
    case 'search':
      return Search
    default:
      return Calculator
  }
}

function getToolColors(type: string) {
  switch (type) {
    case 'openai':
      return {
        color: 'green',
        bg: 'bg-green-50'
      }
    case 'custom':
      return {
        color: 'blue',
        bg: 'bg-blue-50'
      }
    default:
      return {
        color: 'gray',
        bg: 'bg-gray-50'
      }
  }
}

export function ToolCard({
  toolId,
  isSelected,
  onToggle
}: ToolCardProps) {
  const tool = AVAILABLE_TOOLS.find(t => t.id === toolId)
  
  if (!tool) {
    return null
  }
  
  const Icon = getToolIcon(tool.category)
  const colors = getToolColors(tool.type)

  return (
    <Card
      withBorder
      p="md"
      className={`transition-all ${isSelected ? colors.bg : ''}`}
    >
      <Group justify="space-between" align="flex-start">
        <Group gap="md">
          <Icon size={24} />
          <Stack gap={2}>
            <Group gap="xs">
              <Text fw={500} size="sm">{tool.name}</Text>
              <Badge size="xs" color={colors.color} variant="light">
                {tool.type}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              {tool.category === 'calculation' && 'Mathematical calculations'}
              {tool.category === 'search' && 'Web search capabilities'}
            </Text>
          </Stack>
        </Group>

        <Switch
          size="sm"
          checked={isSelected}
          onChange={() => onToggle(toolId)}
        />
      </Group>
    </Card>
  )
}