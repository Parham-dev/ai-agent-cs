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
  Badge, 
  LoadingOverlay,
} from '@mantine/core'
import { Plus } from 'lucide-react'
import { IntegrationCard } from './IntegrationCard'
import { AddIntegrationModal } from './AddIntegrationModal'
import { useIntegrations } from './useIntegrations'
import type { ApiIntegration } from '@/lib/types'
import { AVAILABLE_INTEGRATIONS, type AvailableIntegrationType } from '@/lib/constants'

interface IntegrationGridProps {
  title?: string
  description?: string
  showAddButton?: boolean
  onIntegrationToggle?: (integration: ApiIntegration) => void
  onConfigureCredentials?: (integration: ApiIntegration) => void
  onConfigureTools?: (integration: ApiIntegration) => void
  isIntegrationSelected?: (integrationId: string, integrationType?: string) => boolean
  getSelectedToolsCount?: (integrationId: string) => number
  selectedIntegrations?: Array<{
    integrationId: string
    selectedTools?: string[]
  }>
  showSelectedSummary?: boolean
  onIntegrationAdded?: (integration: ApiIntegration) => void
  // Context-specific props
  showToolsButton?: boolean
  showToolsCount?: boolean
  mode?: 'wizard' | 'management' // wizard for agent creation, management for standalone page
}

export function IntegrationGrid({
  title = "Integrations",
  description = "Connect external services and manage integrations",
  showAddButton = true,
  onIntegrationToggle,
  onConfigureCredentials,
  onConfigureTools,
  isIntegrationSelected = () => false,
  getSelectedToolsCount = () => 0,
  selectedIntegrations = [],
  showSelectedSummary = false,
  onIntegrationAdded,
  showToolsButton = true,
  showToolsCount = true,
  mode = 'wizard'
}: IntegrationGridProps) {
  const [addModalOpened, setAddModalOpened] = useState(false)

  const {
    allIntegrations,
    isLoading,
    addTempIntegration,
    getAvailableTypes,
  } = useIntegrations()

  const availableTypes = getAvailableTypes(AVAILABLE_INTEGRATIONS)

  const handleIntegrationAdded = (integrationType: AvailableIntegrationType) => {
    const newTempIntegration = addTempIntegration(integrationType)
    
    // Notify parent - newTempIntegration is already a complete ApiIntegration
    if (newTempIntegration && onIntegrationAdded) {
      onIntegrationAdded(newTempIntegration)
    }
    
    // Close the modal
    setAddModalOpened(false)
  }

  return (
    <Stack gap="lg">
      <LoadingOverlay visible={isLoading} />
      
      <Stack gap="sm">
        <Group justify="space-between">
          <div>
            <Title order={3}>{title}</Title>
            <Text c="dimmed" size="sm">
              {description}
            </Text>
          </div>
          
          {showAddButton && availableTypes.length > 0 && (
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => setAddModalOpened(true)}
              variant="light"
            >
              Add Integration
            </Button>
          )}
          
          {availableTypes.length === 0 && allIntegrations.length > 0 && (
            <Text size="sm" c="dimmed">
              All available integration types have been added
            </Text>
          )}
        </Group>
      </Stack>

      {/* Integrations Grid */}
      {allIntegrations.length > 0 ? (
        <Grid>
          {allIntegrations.map(integration => {
            const isSelected = isIntegrationSelected(integration.id, integration.type)
            
            return (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                isSelected={isSelected}
                selectedToolsCount={getSelectedToolsCount(integration.id)}
                onToggle={onIntegrationToggle || (() => {})}
                onConfigureCredentials={onConfigureCredentials || (() => {})}
                onConfigureTools={onConfigureTools || (() => {})}
                showToolsButton={showToolsButton}
                showToolsCount={showToolsCount}
                mode={mode}
              />
            )
          })}
        </Grid>
      ) : (
        <Card withBorder p="xl">
          <Stack gap="sm" align="center">
            <Text c="dimmed">No integrations configured for your organization</Text>
            <Text size="sm" c="dimmed">
              Available integration types: {AVAILABLE_INTEGRATIONS.join(', ')}
            </Text>
            {showAddButton && (
              <Button
                leftSection={<Plus size={16} />}
                onClick={() => setAddModalOpened(true)}
                disabled={availableTypes.length === 0}
              >
                Add Your First Integration
              </Button>
            )}
          </Stack>
        </Card>
      )}

      {/* Selected integrations summary */}
      {showSelectedSummary && selectedIntegrations.length > 0 && (
        <Card withBorder p="md">
          <Stack gap="sm">
            <Text fw={500} size="sm">Selected for this agent:</Text>
            <Group gap="xs">
              {selectedIntegrations.map((selected, index) => {
                const integration = allIntegrations.find(int => int.id === selected.integrationId)
                return integration ? (
                  <Badge key={index} variant="light" color="blue">
                    {integration.name} ({selected.selectedTools?.length || 0} tools)
                  </Badge>
                ) : null
              })}
            </Group>
          </Stack>
        </Card>
      )}

      {/* Add Integration Modal */}
      <AddIntegrationModal
        opened={addModalOpened}
        onClose={() => setAddModalOpened(false)}
        onIntegrationAdded={handleIntegrationAdded}
        availableTypes={availableTypes}
      />
    </Stack>
  )
}