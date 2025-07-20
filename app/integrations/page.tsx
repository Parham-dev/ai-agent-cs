'use client'

import React, { useState } from 'react'
import { Stack } from '@mantine/core'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/layout'
import { IntegrationGrid } from '@/components/shared/integrations'
import { ToolConfigurationModal } from '@/components/agents/creation/shared/ToolConfigurationModal'
import { CredentialsFormSection } from '@/components/shared/integrations'
import { useIntegrations } from '@/components/shared/integrations'
import type { ApiIntegration } from '@/lib/types'

export default function IntegrationsPage() {
  const [toolModalOpened, setToolModalOpened] = useState(false)
  const [credentialsFormOpened, setCredentialsFormOpened] = useState(false)
  const [selectedIntegrationForTools, setSelectedIntegrationForTools] = useState<ApiIntegration | null>(null)
  const [selectedIntegrationForCredentials, setSelectedIntegrationForCredentials] = useState<ApiIntegration | null>(null)
  const [enabledIntegrations, setEnabledIntegrations] = useState<Set<string>>(new Set())

  const {
    saveIntegrationCredentials,
    allIntegrations
  } = useIntegrations()

  // Auto-enable existing integrations on mount
  React.useEffect(() => {
    const newEnabledSet = new Set(enabledIntegrations)
    let hasChanges = false
    
    allIntegrations.forEach((integration: ApiIntegration) => {
      if (!newEnabledSet.has(integration.id)) {
        newEnabledSet.add(integration.id)
        hasChanges = true
      }
    })
    
    if (hasChanges) {
      setEnabledIntegrations(newEnabledSet)
    }
  }, [allIntegrations, enabledIntegrations])

  // Handle integration toggle
  const handleIntegrationToggle = (integration: ApiIntegration) => {
    setEnabledIntegrations(prev => {
      const newSet = new Set(prev)
      const isCurrentlyEnabled = newSet.has(integration.id)
      
      if (isCurrentlyEnabled) {
        // Disabling the integration
        newSet.delete(integration.id)
        
        // Close credentials form if it's open for this integration
        if (credentialsFormOpened && selectedIntegrationForCredentials?.id === integration.id) {
          setCredentialsFormOpened(false)
          setSelectedIntegrationForCredentials(null)
        }
      } else {
        // Enabling the integration
        newSet.add(integration.id)
        
        // If this is a temp integration (doesn't exist in DB), auto-show config form
        if (integration.id.startsWith('temp-')) {
          setSelectedIntegrationForCredentials(integration)
          setCredentialsFormOpened(true)
        }
      }
      
      return newSet
    })
  }

  // Handle new integration added - automatically enable it and show config form
  const handleIntegrationAdded = (integration: ApiIntegration) => {
    setEnabledIntegrations(prev => {
      const newSet = new Set(prev)
      newSet.add(integration.id)
      return newSet
    })
    
    // Auto-show config form for new integrations since they need to be configured
    setSelectedIntegrationForCredentials(integration)
    setCredentialsFormOpened(true)
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
  const handleCredentialsSaved = async (integrationData: Partial<ApiIntegration>) => {
    try {
      const tempId = selectedIntegrationForCredentials?.id
      await saveIntegrationCredentials(integrationData, tempId)
      
      setCredentialsFormOpened(false)
      setSelectedIntegrationForCredentials(null)
      
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

  return (
    <DashboardLayout title="Integrations" subtitle="Connect external services and manage your organization's integrations">
      <Stack gap="lg">
        <IntegrationGrid
          title="Integrations"
          description="Connect external services and manage your organization's integrations"
          showAddButton={true}
          onIntegrationToggle={handleIntegrationToggle}
          onConfigureCredentials={handleConfigureCredentials}
          onConfigureTools={handleConfigureTools}
          isIntegrationSelected={(integrationId: string) => enabledIntegrations.has(integrationId)}
          getSelectedToolsCount={() => 0} // No tool selection for standalone page
          selectedIntegrations={[]}
          showSelectedSummary={false}
          onIntegrationAdded={handleIntegrationAdded}
          showToolsButton={false}
          showToolsCount={false}
          mode="management"
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
            selectedTools={[]} // No pre-selected tools for standalone page
            onToolsChanged={() => {}} // No handling for standalone page
          />
        )}
      </Stack>
    </DashboardLayout>
  )
}