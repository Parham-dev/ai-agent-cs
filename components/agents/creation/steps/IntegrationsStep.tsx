'use client'

import { useState } from 'react'
import { Stack } from '@mantine/core'
import { toast } from 'sonner'
import { StepProps } from '../forms/types'
import { ToolConfigurationModal } from '../shared/ToolConfigurationModal'
import { CredentialsFormSection } from '@/components/shared/integrations'
import { useIntegrationFormState } from '../shared/hooks'
import { useIntegrationManagement } from '@/components/shared/integrations'
import { IntegrationGrid } from '@/components/shared/integrations'
import type { ApiIntegration } from '@/lib/types'

export function IntegrationsStep({ form }: StepProps) {
  // Modal state
  const [toolModalOpened, setToolModalOpened] = useState(false)
  const [credentialsFormOpened, setCredentialsFormOpened] = useState(false)
  const [selectedIntegrationForTools, setSelectedIntegrationForTools] = useState<ApiIntegration | null>(null)
  const [selectedIntegrationForCredentials, setSelectedIntegrationForCredentials] = useState<ApiIntegration | null>(null)

  // Custom hooks
  const {
    handleCredentialsSaved: handleCredentialsSavedHook
  } = useIntegrationManagement()

  const {
    isIntegrationSelected,
    getSelectedTools,
    toggleIntegration: toggleIntegrationBase,
    updateSelectedTools,
    updateIntegrationId
  } = useIntegrationFormState(form)

  // Wrap toggle integration to also close credentials form when disabling
  const toggleIntegration = (integration: ApiIntegration) => {
    const wasSelected = isIntegrationSelected(integration.id)
    
    // Call the base toggle function
    toggleIntegrationBase(integration)
    
    if (wasSelected) {
      // If integration was selected and is now being deselected, close credentials form
      if (credentialsFormOpened && selectedIntegrationForCredentials?.id === integration.id) {
        setCredentialsFormOpened(false)
        setSelectedIntegrationForCredentials(null)
      }
    } else {
      // If integration was not selected and is now being selected
      // If this is a temp integration (doesn't exist in DB), auto-show config form
      if (integration.id.startsWith('temp-')) {
        setSelectedIntegrationForCredentials(integration)
        setCredentialsFormOpened(true)
      }
    }
  }

  // Handle opening tool configuration
  const handleConfigureTools = (integration: ApiIntegration) => {
    if (integration.id.startsWith('temp-')) {
      toast.info('Tool configuration will be available after credentials are configured')
      return
    }
    setSelectedIntegrationForTools(integration)
    setToolModalOpened(true)
  }

  // Handle opening credentials form (toggle)
  const handleConfigureCredentials = (integration: ApiIntegration) => {
    if (credentialsFormOpened && selectedIntegrationForCredentials?.id === integration.id) {
      // If form is already open for this integration, close it
      setCredentialsFormOpened(false)
      setSelectedIntegrationForCredentials(null)
    } else {
      // Open form for this integration
      setSelectedIntegrationForCredentials(integration)
      setCredentialsFormOpened(true)
    }
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
      <IntegrationGrid
        title="Integrations"
        description="Connect external services and select which tools your agent can use"
        showAddButton={true}
        onIntegrationToggle={toggleIntegration}
        onConfigureCredentials={handleConfigureCredentials}
        onConfigureTools={handleConfigureTools}
        isIntegrationSelected={isIntegrationSelected}
        getSelectedToolsCount={(integrationId: string) => getSelectedTools(integrationId).length}
        selectedIntegrations={form.getValues().selectedIntegrations}
        showSelectedSummary={true}
        selectedIntegrationForCredentials={selectedIntegrationForCredentials}
      />

      {/* Credentials Form Section */}
      {credentialsFormOpened && selectedIntegrationForCredentials && (
        <CredentialsFormSection
          integration={selectedIntegrationForCredentials}
          onSave={handleCredentialsSaved}
          onCancel={handleCredentialsCancelled}
        />
      )}

      {/* Tool Configuration Modal */}
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
