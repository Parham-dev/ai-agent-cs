'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import { getIntegrationDisplayName } from './integration-utils'
import type { ApiIntegration } from '@/lib/types'

type AvailableIntegrationType = 'shopify' | 'stripe'

interface TempIntegration {
  id: string
  name: string
  type: string
}

// Return type for addIntegrationType
type AddIntegrationResult = TempIntegration

export function useIntegrationManagement() {
  const [orgIntegrations, setOrgIntegrations] = useState<ApiIntegration[]>([])
  const [tempIntegrations, setTempIntegrations] = useState<TempIntegration[]>([])
  const [loading, setLoading] = useState(true)

  // Load organization integrations on mount
  useEffect(() => {
    loadOrgIntegrations()
  }, [])

  const loadOrgIntegrations = async () => {
    try {
      setLoading(true)
      const integrations = await apiClient.getIntegrations({ isActive: true })
      setOrgIntegrations(integrations)
    } catch (error) {
      console.error('Failed to load integrations:', error)
      toast.error('Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  // Get all integrations (org + temp)
  const getAllIntegrations = (): ApiIntegration[] => {
    return [
      ...orgIntegrations,
      ...tempIntegrations.map(temp => ({
        ...temp,
        description: `${getIntegrationDisplayName(temp.type)} integration`,
        isActive: true,
        credentials: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: 'temp'
      } as ApiIntegration))
    ]
  }

  // Get available integration types (not already in org or temp)
  const getAvailableTypes = (availableIntegrations: readonly AvailableIntegrationType[]): AvailableIntegrationType[] => {
    const existingTypes = [
      ...orgIntegrations.map(int => int.type),
      ...tempIntegrations.map(int => int.type)
    ]
    return availableIntegrations.filter((type: AvailableIntegrationType) => !existingTypes.includes(type))
  }

  // Handle adding new integration type
  const addIntegrationType = (integrationType: AvailableIntegrationType): AddIntegrationResult => {
    const newTempIntegration: TempIntegration = {
      id: `temp-${integrationType}-${Date.now()}`,
      name: getIntegrationDisplayName(integrationType),
      type: integrationType
    }
    setTempIntegrations(current => [...current, newTempIntegration])
    return newTempIntegration
  }

  // Handle credentials saved - replace temp with real integration
  const handleCredentialsSaved = (savedIntegration: ApiIntegration, tempIntegrationId?: string) => {
    if (tempIntegrationId?.startsWith('temp-')) {
      // Replace temp integration with real one
      setTempIntegrations(current => 
        current.filter(temp => temp.id !== tempIntegrationId)
      )
      setOrgIntegrations(current => [...current, savedIntegration])
      return { replacedTempId: tempIntegrationId, newIntegrationId: savedIntegration.id }
    } else {
      // Update existing integration
      setOrgIntegrations(current => 
        current.map(int => int.id === savedIntegration.id ? savedIntegration : int)
      )
      return { replacedTempId: null, newIntegrationId: savedIntegration.id }
    }
  }

  return {
    orgIntegrations,
    tempIntegrations,
    loading,
    getAllIntegrations,
    getAvailableTypes,
    addIntegrationType,
    handleCredentialsSaved,
    loadOrgIntegrations
  }
}
