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
import { toast } from 'sonner'
import { StepProps } from '../forms/types'
import { AVAILABLE_INTEGRATIONS } from '../shared/constants'
import { AddIntegrationModal } from '../shared/AddIntegrationModal'
import { ToolConfigurationModal } from '../shared/ToolConfigurationModal'
import { IntegrationCard, CredentialsFormSection } from '../shared/components'
import { useIntegrationManagement, useIntegrationFormState } from '../shared/hooks'
import type { ApiIntegration } from '@/lib/types'

export function IntegrationsStep({ form }: StepProps) {
  // Modal state
  const [addModalOpened, setAddModalOpened] = useState(false)
  const [toolModalOpened, setToolModalOpened] = useState(false)
  const [credentialsFormOpened, setCredentialsFormOpened] = useState(false)
  const [selectedIntegrationForTools, setSelectedIntegrationForTools] = useState<ApiIntegration | null>(null)
  const [selectedIntegrationForCredentials, setSelectedIntegrationForCredentials] = useState<ApiIntegration | null>(null)

  // Custom hooks
  const {
    loading,
    getAllIntegrations,
    addIntegrationType,
    handleCredentialsSaved: handleCredentialsSavedHook
  } = useIntegrationManagement()

  const {
    isIntegrationSelected,
    getSelectedTools,
    toggleIntegration,
    updateSelectedTools,
    updateIntegrationId
  } = useIntegrationFormState(form)

  // Get all integrations for display
  const allIntegrations = getAllIntegrations()
  
  // Filter out integration types that are already in the grid
  const existingTypes = allIntegrations.map(integration => integration.type)
  const availableTypes = AVAILABLE_INTEGRATIONS.filter(type => !existingTypes.includes(type))

  // Handle opening tool configuration
  const handleConfigureTools = (integration: ApiIntegration) => {
    if (integration.id.startsWith('temp-')) {
      toast.info('Tool configuration will be available after credentials are configured')
      return
    }
    setSelectedIntegrationForTools(integration)
    setToolModalOpened(true)
  }

  // Handle opening credentials form
  const handleConfigureCredentials = (integration: ApiIntegration) => {
    setSelectedIntegrationForCredentials(integration)
    setCredentialsFormOpened(true)
  }

  // Handle credentials saved
  const handleCredentialsSaved = (savedIntegration: ApiIntegration) => {
    const result = handleCredentialsSavedHook(savedIntegration, selectedIntegrationForCredentials?.id)
    
    if (result.replacedTempId) {
      // Update form selections to use new integration ID
      updateIntegrationId(result.replacedTempId, result.newIntegrationId)
    }
    
    setCredentialsFormOpened(false)
    setSelectedIntegrationForCredentials(null)
  }

  // Handle credentials cancelled
  const handleCredentialsCancelled = () => {
    setCredentialsFormOpened(false)
    setSelectedIntegrationForCredentials(null)
  }

  // Handle tool selection change
  const handleToolsChanged = (tools: string[]) => {
    if (!selectedIntegrationForTools) return
    updateSelectedTools(selectedIntegrationForTools.id, tools)
  }

  return (
    <Stack gap="lg">
      <LoadingOverlay visible={loading} />
      
      <Stack gap="sm">
        <Group justify="space-between">
          <div>
            <Title order={3}>Integrations</Title>
            <Text c="dimmed" size="sm">
              Connect external services and select which tools your agent can use
            </Text>
          </div>
          
          {availableTypes.length > 0 ? (
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => setAddModalOpened(true)}
              variant="light"
            >
              Add Integration
            </Button>
          ) : allIntegrations.length > 0 ? (
            <Text size="sm" c="dimmed">
              All available integration types have been added
            </Text>
          ) : null}
        </Group>
      </Stack>

      {/* Integrations Grid */}
      {allIntegrations.length > 0 ? (
        <Grid>
          {allIntegrations.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              isSelected={isIntegrationSelected(integration.id)}
              selectedToolsCount={getSelectedTools(integration.id).length}
              onToggle={toggleIntegration}
              onConfigureCredentials={handleConfigureCredentials}
              onConfigureTools={handleConfigureTools}
            />
          ))}
        </Grid>
      ) : (
        <Card withBorder p="xl">
          <Stack gap="sm" align="center">
            <Text c="dimmed">No integrations configured for your organization</Text>
            <Text size="sm" c="dimmed">
              Available integration types: {AVAILABLE_INTEGRATIONS.join(', ')}
            </Text>
            <Button
              leftSection={<Plus size={16} />}
              onClick={() => setAddModalOpened(true)}
              disabled={availableTypes.length === 0}
            >
              Add Your First Integration
            </Button>
          </Stack>
        </Card>
      )}

      {/* Selected integrations summary */}
      {form.getValues().selectedIntegrations?.length > 0 && (
        <Card withBorder p="md">
          <Stack gap="sm">
            <Text fw={500} size="sm">Selected for this agent:</Text>
            <Group gap="xs">
              {form.getValues().selectedIntegrations?.map((selected, index) => {
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

      {/* Credentials Form Section */}
      {credentialsFormOpened && selectedIntegrationForCredentials && (
        <CredentialsFormSection
          integration={selectedIntegrationForCredentials}
          onSave={handleCredentialsSaved}
          onCancel={handleCredentialsCancelled}
        />
      )}

      {/* Modals */}
      <AddIntegrationModal
        opened={addModalOpened}
        onClose={() => setAddModalOpened(false)}
        onIntegrationAdded={addIntegrationType}
        availableTypes={availableTypes}
      />

      {selectedIntegrationForTools && (
        <ToolConfigurationModal
          opened={toolModalOpened}
          onClose={() => {
            setToolModalOpened(false)
            setSelectedIntegrationForTools(null)
          }}
          integration={selectedIntegrationForTools}
          selectedTools={getSelectedTools(selectedIntegrationForTools.id)}
          onToolsChanged={handleToolsChanged}
        />
      )}
    </Stack>
  )
}
