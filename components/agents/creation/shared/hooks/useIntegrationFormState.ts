'use client'

import type { ApiIntegration } from '@/lib/types'
import type { AgentFormData } from '../../forms/types'
import type { UseFormReturnType } from '@mantine/form'

export function useIntegrationFormState(form: UseFormReturnType<AgentFormData>) {
  // Check if integration is selected for this agent
  // Uses both direct ID matching and type-based matching for transition handling
  const isIntegrationSelected = (integrationId: string, integrationType?: string) => {
    const selections = form.getValues().selectedIntegrations || []
    
    // Direct ID match (most common case)
    const directMatch = selections.some(selected => selected.integrationId === integrationId)
    if (directMatch) return true
    
    // If no direct match and we have the integration type, check by type
    // This handles transitions where temp ID becomes real ID or vice versa
    if (integrationType) {
      const typeMatch = selections.some(selected => {
        if (selected.integrationId.startsWith('temp-')) {
          // Form has temp ID, extract type and compare
          const selectedType = selected.integrationId.split('-')[1]  // Extract from temp-{type}-{timestamp}
          return selectedType === integrationType
        } else {
          // Form has real ID, but we're checking against an integration of this type
          // This means we need to check if ANY selection matches this type
          // For now, we assume if the types match and it's a different ID, it could be the same integration
          return false // Let direct match handle real IDs
        }
      })
      return typeMatch
    }
    
    return false
  }

  // Get selected tools for integration
  const getSelectedTools = (integrationId: string) => {
    const selected = form.getValues().selectedIntegrations?.find(
      selected => selected.integrationId === integrationId
    )
    return selected?.selectedTools || []
  }

  // Toggle integration selection
  const toggleIntegration = (integration: ApiIntegration) => {
    const currentSelections = form.getValues().selectedIntegrations || []
    
    if (isIntegrationSelected(integration.id)) {
      // Remove integration
      const updated = currentSelections.filter(s => s.integrationId !== integration.id)
      form.setFieldValue('selectedIntegrations', updated)
    } else {
      // Add integration with no tools initially
      const updated = [...currentSelections, {
        integrationId: integration.id,
        selectedTools: [],
        config: {}
      }]
      form.setFieldValue('selectedIntegrations', updated)
    }
  }

  // Handle tool selection change
  const updateSelectedTools = (integrationId: string, tools: string[]) => {
    const currentSelections = form.getValues().selectedIntegrations || []
    const updated = currentSelections.map(selection => 
      selection.integrationId === integrationId
        ? { ...selection, selectedTools: tools }
        : selection
    )
    form.setFieldValue('selectedIntegrations', updated)
  }

  // Updates the integration ID (when temp becomes real)
  const updateIntegrationId = (oldId: string, newId: string) => {
    const current = form.getValues().selectedIntegrations || []
    const updated = current.map(selected =>
      selected.integrationId === oldId
        ? { ...selected, integrationId: newId }
        : selected
    )
    
    form.setFieldValue('selectedIntegrations', updated)
  }

  return {
    isIntegrationSelected,
    getSelectedTools,
    toggleIntegration,
    updateSelectedTools,
    updateIntegrationId
  }
}
