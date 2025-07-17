'use client'

import type { ApiIntegration } from '@/lib/types'
import type { AgentFormData } from '../../forms/types'
import type { UseFormReturnType } from '@mantine/form'

export function useIntegrationFormState(form: UseFormReturnType<AgentFormData>) {
  // Check if integration is selected for this agent
  const isIntegrationSelected = (integrationId: string) => {
    return form.getValues().selectedIntegrations?.some(
      selected => selected.integrationId === integrationId
    ) || false
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

  // Update integration ID when temp integration becomes real
  const updateIntegrationId = (oldId: string, newId: string) => {
    const currentSelections = form.getValues().selectedIntegrations || []
    const updated = currentSelections.map(selection => 
      selection.integrationId === oldId
        ? { ...selection, integrationId: newId }
        : selection
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
