'use client'

import React, { useState } from 'react'
import { StepProps } from './types'
import { 
  IntegrationSelectModal, 
  IntegrationsGrid, 
  IntegrationConfiguration,
  type ConfiguredIntegration 
} from './components'
import { AVAILABLE_INTEGRATIONS } from './components/integration-select-modal'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function IntegrationsStep({ form: _form }: StepProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [configuredIntegrations, setConfiguredIntegrations] = useState<ConfiguredIntegration[]>([])

  const handleSelectIntegration = (integrationId: string) => {
    setSelectedIntegration(integrationId)
    setShowModal(false)
  }

  const handleSaveIntegration = (integrationData: Omit<ConfiguredIntegration, 'id' | 'name' | 'icon' | 'color'>) => {
    if (!selectedIntegration) return
    
    const integration = AVAILABLE_INTEGRATIONS.find(i => i.id === selectedIntegration)
    if (!integration) return

    const newIntegration: ConfiguredIntegration = {
      id: integration.id,
      name: integration.name,
      icon: integration.icon,
      color: integration.color,
      ...integrationData
    }

    setConfiguredIntegrations([...configuredIntegrations, newIntegration])
    setSelectedIntegration(null)
  }

  const handleDeleteIntegration = (integrationId: string) => {
    setConfiguredIntegrations(configuredIntegrations.filter(i => i.id !== integrationId))
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

          {/* Configured Integrations Grid */}
          <IntegrationsGrid
            configuredIntegrations={configuredIntegrations}
            onAddIntegration={() => setShowModal(true)}
            onDeleteIntegration={handleDeleteIntegration}
          />

          {/* Integration Selection Modal */}
          <IntegrationSelectModal
            open={showModal}
            onOpenChange={setShowModal}
            onSelectIntegration={handleSelectIntegration}
          />

          {/* Integration Configuration */}
          {selectedIntegration && (
            <IntegrationConfiguration
              selectedIntegration={selectedIntegration}
              onCancel={handleCancelConfiguration}
              onSave={handleSaveIntegration}
            />
          )}

          {/* Empty State */}
          {configuredIntegrations.length === 0 && !selectedIntegration && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No integrations configured yet. Click the + button above to add your first integration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
