'use client'

import { useState } from 'react'
import { 
  Stack, 
  Title, 
  Text, 
  Grid, 
  Card, 
  Group, 
  Button,
} from '@mantine/core'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { StepProps } from '../forms/types'
import { AVAILABLE_TOOLS } from '@/lib/tools'
import { AddToolModal } from '../shared/AddToolModal'
import { ToolCard } from '../shared/ToolCard'

export function ToolsStep({ form }: StepProps) {
  const [addModalOpened, setAddModalOpened] = useState(false)

  // Get current form values
  const selectedTools = form.getValues().selectedTools || []
  const availableTools = form.getValues().availableTools || []

  // Get available tools that aren't already added
  const availableToAdd = AVAILABLE_TOOLS.filter(tool => 
    tool.enabled && !availableTools.includes(tool.id)
  )

  // Handle adding a tool
  const handleToolAdded = (toolId: string) => {
    const currentAvailable = form.getValues().availableTools || []
    const currentSelected = form.getValues().selectedTools || []
    
    form.setFieldValue('availableTools', [...currentAvailable, toolId])
    form.setFieldValue('selectedTools', [...currentSelected, toolId])
    
    const tool = AVAILABLE_TOOLS.find(t => t.id === toolId)
    toast.success(`${tool?.name || 'Tool'} added and enabled`)
  }

  // Handle toggling tool selection
  const handleToolToggle = (toolId: string) => {
    const currentSelected = form.getValues().selectedTools || []
    const isSelected = currentSelected.includes(toolId)
    const tool = AVAILABLE_TOOLS.find(t => t.id === toolId)
    
    if (isSelected) {
      form.setFieldValue('selectedTools', currentSelected.filter(id => id !== toolId))
      toast.success(`${tool?.name || 'Tool'} disabled`)
    } else {
      form.setFieldValue('selectedTools', [...currentSelected, toolId])
      toast.success(`${tool?.name || 'Tool'} enabled`)
    }
  }


  return (
    <Stack gap="lg">
      <Stack gap="sm">
        <Group justify="space-between">
          <div>
            <Title order={3}>Tools & Capabilities</Title>
            <Text c="dimmed" size="sm">
              Add universal tools that enhance your agent&apos;s capabilities
            </Text>
          </div>
          
          {availableToAdd.length > 0 ? (
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => setAddModalOpened(true)}
              variant="light"
            >
              Add Tool
            </Button>
          ) : availableTools.length > 0 ? (
            <Text size="sm" c="dimmed">
              All available tools have been added
            </Text>
          ) : null}
        </Group>
      </Stack>

      {/* Tools Grid */}
      {availableTools.length > 0 ? (
        <Grid>
          {availableTools.map(toolId => (
            <Grid.Col key={toolId} span={{ base: 12, sm: 6, lg: 4 }}>
              <ToolCard
                toolId={toolId}
                isSelected={selectedTools.includes(toolId)}
                onToggle={handleToolToggle}
              />
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        <Card withBorder p="xl">
          <Stack gap="sm" align="center">
            <Text c="dimmed">No tools configured yet</Text>
            <Text size="sm" c="dimmed">
              Available tools: Web Search, Customer Memory, and more
            </Text>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => setAddModalOpened(true)}
              disabled={availableToAdd.length === 0}
            >
              Add Your First Tool
            </Button>
          </Stack>
        </Card>
      )}


      {/* Add Tool Modal */}
      <AddToolModal
        opened={addModalOpened}
        onClose={() => setAddModalOpened(false)}
        onToolAdded={handleToolAdded}
        selectedToolIds={availableTools}
      />
    </Stack>
  )
}
