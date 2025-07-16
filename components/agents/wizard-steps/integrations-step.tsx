'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { StepProps } from './types'
import { 
  IntegrationSelectModal,
  IntegrationsGrid, 
  IntegrationConfiguration,
  type ConfiguredIntegration,
  type IntegrationDisplayItem
} from './components'
import { AVAILABLE_INTEGRATIONS } from './components/integration-select-modal'
import type { IntegrationCredentials } from '@/lib/types/integrations'

interface OrganizationIntegration {
  id: string
  type: string
  name: string
  credentials: IntegrationCredentials
  settings: Record<string, unknown>
  isActive: boolean
}

export function IntegrationsStep({ form }: StepProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [organizationIntegrations, setOrganizationIntegrations] = useState<OrganizationIntegration[]>([])
  const [loading, setLoading] = useState(true)
  
  // Fetch organization integrations on component mount
  useEffect(() => {
    async function fetchOrganizationIntegrations() {
      try {
        setLoading(true)
        const response = await fetch('/api/integrations')
        if (response.ok) {
          const data = await response.json()
          const integrations = data.data?.integrations || []
          setOrganizationIntegrations(integrations)
          console.log('Fetched organization integrations:', integrations)
        } else {
          console.error('Failed to fetch integrations:', response.status, await response.text())
        }
      } catch (error) {
        console.error('Failed to fetch organization integrations:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrganizationIntegrations()
  }, [])
  
  // Create display items only for integrations that exist in the database
  const displayIntegrations = useMemo(() => {
    const integrationConfigurations = form.watch('integrationConfigurations') || []
    
    console.log('Integration configurations from form:', integrationConfigurations)
    console.log('Organization integrations:', organizationIntegrations)
    
    return organizationIntegrations.map(orgIntegration => {
      const availableIntegration = AVAILABLE_INTEGRATIONS.find(
        ai => ai.id === orgIntegration.type
      )
      
      // Check if this integration is configured for this agent
      const agentConfig = integrationConfigurations.find(
        (config: { type: string }) => config.type === orgIntegration.type
      )
      
      // Integration is "enabled for this agent" if it has a configuration
      const isEnabledForAgent = !!agentConfig
      
      // Calculate selected tools count
      const selectedToolsCount = agentConfig?.selectedTools?.length || 0
      
      const displayItem = {
        id: orgIntegration.type,
        name: orgIntegration.name,
        type: orgIntegration.type,
        icon: availableIntegration?.icon || '🔗',
        color: availableIntegration?.color || 'from-gray-500 to-gray-600',
        status: 'configured' as const,
        isEnabled: isEnabledForAgent, // This agent can use this integration
        isConnected: orgIntegration.isActive, // Organization-level connection status
        selectedToolsCount,
        existsInDatabase: true,
        credentials: orgIntegration.credentials
      } as IntegrationDisplayItem
      
      console.log('Display item for', orgIntegration.type, ':', displayItem)
      return displayItem
    })
  }, [organizationIntegrations, form])
  
  // Get available integrations that are not in the database (for the modal)
  const availableIntegrationsForModal = useMemo(() => {
    const filtered = AVAILABLE_INTEGRATIONS.filter(available => 
      available.status === 'available' && 
      !organizationIntegrations.some(org => org.type === available.id)
    )
    return filtered
  }, [organizationIntegrations])

  const handleAddIntegration = () => {
    setShowModal(true)
  }
  
  const handleSelectIntegration = (integrationId: string) => {
    setSelectedIntegration(integrationId)
    setShowModal(false)
  }
  
  const handleToggleIntegration = (integrationId: string, enabled: boolean) => {
    const currentConfigs = form.getValues('integrationConfigurations') || []
    
    if (enabled) {
      // Add this integration to the agent's configuration
      const orgIntegration = organizationIntegrations.find(org => org.type === integrationId)
      const availableIntegration = AVAILABLE_INTEGRATIONS.find(ai => ai.id === integrationId)
      
      if (orgIntegration && availableIntegration) {
        const existingConfigIndex = currentConfigs.findIndex((config: { type: string }) => config.type === integrationId)
        
        const newIntegrationConfig = {
          id: integrationId,
          name: orgIntegration.name,
          type: integrationId,
          credentials: orgIntegration.credentials,
          selectedTools: orgIntegration.settings?.selectedTools || availableIntegration.tools.map(tool => tool.id), // Use existing tools or default to all
          isConnected: orgIntegration.isActive, // Use organization-level connection status
          settings: {
            selectedTools: orgIntegration.settings?.selectedTools || availableIntegration.tools.map(tool => tool.id),
            isConnected: orgIntegration.isActive
          }
        }
        
        if (existingConfigIndex !== -1) {
          // Update existing config
          currentConfigs[existingConfigIndex] = newIntegrationConfig
        } else {
          // Add new config
          currentConfigs.push(newIntegrationConfig)
        }
        
        form.setValue('integrationConfigurations', currentConfigs)
        console.log('Added integration to agent config:', integrationId)
      }
    } else {
      // Remove this integration from the agent's configuration
      const updatedConfigs = currentConfigs.filter((config: { type: string }) => config.type !== integrationId)
      form.setValue('integrationConfigurations', updatedConfigs)
      console.log('Removed integration from agent config:', integrationId)
    }
  }
  
  const handleEditIntegration = (integrationId: string) => {
    // Toggle the configuration - close if already open for the same integration
    if (selectedIntegration === integrationId) {
      setSelectedIntegration(null)
    } else {
      setSelectedIntegration(integrationId)
    }
  }

  const handleSaveIntegration = (integrationData: Omit<ConfiguredIntegration, 'id' | 'name' | 'icon' | 'color'>) => {
    if (!selectedIntegration) return
    
    const integration = AVAILABLE_INTEGRATIONS.find(i => i.id === selectedIntegration)
    if (!integration) return

    const newIntegrationConfig = {
      id: integration.id,
      name: integration.name,
      type: integration.id, // Use id as type
      credentials: integrationData.credentials,
      selectedTools: integrationData.selectedTools || [],
      isConnected: integrationData.isConnected || false,
      settings: {
        selectedTools: integrationData.selectedTools || [],
        isConnected: integrationData.isConnected || false
      }
    }

    // Update form data - replace existing or add new
    const currentConfigs = form.getValues('integrationConfigurations') || []
    const existingIndex = currentConfigs.findIndex((config: { type: string }) => config.type === integration.id)
    
    if (existingIndex !== -1) {
      // Update existing
      currentConfigs[existingIndex] = newIntegrationConfig
    } else {
      // Add new
      currentConfigs.push(newIntegrationConfig)
    }
    
    form.setValue('integrationConfigurations', currentConfigs)
    console.log('Saved integration config for agent:', integration.id)

    setSelectedIntegration(null)
  }


  const handleCancelConfiguration = () => {
    setSelectedIntegration(null)
  }
  

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-blue-500/5 to-cyan-500/5 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-3xl p-8 shadow-2xl">
          <div className="border-b border-gradient-to-r from-indigo-200/50 to-blue-200/50 dark:from-indigo-800/50 dark:to-blue-800/50 pb-6 mb-8">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
              Integrations
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Connect your agent to external services and platforms (optional)
            </p>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Integrations Grid */}
              <IntegrationsGrid
                integrations={displayIntegrations}
                onAddIntegration={handleAddIntegration}
                onToggleIntegration={handleToggleIntegration}
                onEditIntegration={handleEditIntegration}
              />
              
              {/* Integration Selection Modal */}
              <IntegrationSelectModal
                open={showModal}
                onOpenChange={setShowModal}
                onSelectIntegration={handleSelectIntegration}
                availableIntegrations={availableIntegrationsForModal}
              />
            </>
          )}

          {/* Integration Configuration */}
          {selectedIntegration && (
            <IntegrationConfiguration
              selectedIntegration={selectedIntegration}
              existingConfiguration={(() => {
                const integrationConfigs = form.getValues('integrationConfigurations') || []
                const existingConfig = integrationConfigs.find((config: { type: string }) => config.type === selectedIntegration)
                const orgIntegration = organizationIntegrations.find(org => org.type === selectedIntegration)
                
                if (existingConfig) {
                  // Use agent's configuration if it exists
                  return existingConfig
                } else if (orgIntegration) {
                  // Return organization integration data as defaults
                  return {
                    type: orgIntegration.type,
                    credentials: orgIntegration.credentials,
                    selectedTools: orgIntegration.settings?.selectedTools || [],
                    isConnected: orgIntegration.isActive,
                    settings: orgIntegration.settings || {}
                  }
                }
                return null
              })()}
              onCancel={handleCancelConfiguration}
              onSave={handleSaveIntegration}
            />
          )}

          {/* Empty State - only show if no integrations are enabled for this agent */}
          {!loading && displayIntegrations.filter(i => i.isEnabled).length === 0 && !selectedIntegration && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No integrations enabled for this agent yet. Toggle the switches above to enable integrations for your agent.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
