'use client'

import { useState } from 'react'
import { Stack } from '@mantine/core'
import { toast } from 'sonner'
import { StepProps } from '../forms/types'
import { ToolConfigurationModal } from '../shared/ToolConfigurationModal'
import { CredentialsFormSection } from '@/components/shared/integrations'
import { useIntegrationFormState } from '../shared/hooks'
import { useIntegrations } from '@/components/shared/integrations'
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
    saveIntegrationCredentials
  } = useIntegrations()

  const {
    isIntegrationSelected,
    getSelectedTools,
    toggleIntegration: toggleIntegrationBase,
    updateSelectedTools,
    updateIntegrationId
  } = useIntegrationFormState(form)

  // Handle integration toggle - simplified logic
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
    }
    // Note: Auto-show credentials form is now handled in handleIntegrationAdded
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

  // Handle add integration - auto-select and show credentials
  const handleIntegrationAdded = (integration: ApiIntegration) => {
    // Auto-select the new integration
    toggleIntegrationBase(integration)
    
    // Auto-show credentials form
    setSelectedIntegrationForCredentials(integration)
    setCredentialsFormOpened(true)
  }

  // Handle credentials saved - simplified without state synchronization complexity
  const handleCredentialsSaved = async (savedIntegration: ApiIntegration) => {
    try {
      const tempId = selectedIntegrationForCredentials?.id
      
      // Process the saved integration (will handle temp→real promotion internally)
      await saveIntegrationCredentials(savedIntegration, tempId)
      
      // Update form to use the new real integration ID if this was a temp integration
      if (tempId?.startsWith('temp-')) {
        updateIntegrationId(tempId, savedIntegration.id)
      }

      // Clear the selected integration and close modals
      setSelectedIntegrationForCredentials(null)
      setCredentialsFormOpened(false)

      toast.success('Integration configured successfully!')
      
    } catch (error) {
      console.error('Failed to save integration:', error)
      toast.error('Failed to configure integration')
    }
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
        onIntegrationAdded={handleIntegrationAdded}
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
