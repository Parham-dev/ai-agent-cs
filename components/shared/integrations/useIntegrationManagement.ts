'use client'

import { useState, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { getIntegrationDisplayName } from './integration-utils'
import type { ApiIntegration } from '@/lib/types'

type AvailableIntegrationType = 'shopify' | 'stripe'

// Use ApiIntegration structure for temp integrations too - keep it simple and consistent
type TempIntegration = ApiIntegration

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
      const integrations = await api.integrations.getIntegrations({ isActive: true })
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
    const tempAsApi: ApiIntegration[] = tempIntegrations.map(temp => ({
      id: temp.id,
      name: temp.name,
      type: temp.type,
      description: `${getIntegrationDisplayName(temp.type)} integration`,
      isActive: true,
      credentials: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: 'temp'
    }))
    
    return [...orgIntegrations, ...tempAsApi]
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
      type: integrationType,
      description: `${getIntegrationDisplayName(integrationType)} integration`,
      isActive: true,
      credentials: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: 'temp'
    }
    setTempIntegrations(current => [...current, newTempIntegration])
    return newTempIntegration
  }

  // Handle credentials saved - synchronous state transition
  const handleCredentialsSaved = (savedIntegration: ApiIntegration, tempIntegrationId?: string) => {
    console.log('🏭 useIntegrationManagement handleCredentialsSaved called:', {
      savedIntegration: { id: savedIntegration.id, type: savedIntegration.type },
      tempIntegrationId,
      currentTempIntegrations: tempIntegrations.map(t => ({ id: t.id, type: t.type })),
      currentOrgIntegrations: orgIntegrations.map(o => ({ id: o.id, type: o.type }))
    })
    
    if (tempIntegrationId?.startsWith('temp-')) {
      console.log('🏭 Processing temp integration replacement')
      // Use flushSync to ensure immediate, synchronous state updates
      flushSync(() => {
        setTempIntegrations(current => {
          const filtered = current.filter(temp => temp.id !== tempIntegrationId)
          console.log('🏭 Removing temp integration:', {
            removed: tempIntegrationId,
            remaining: filtered.map(t => ({ id: t.id, type: t.type }))
          })
          return filtered
        })
        setOrgIntegrations(current => {
          const updated = [...current, savedIntegration]
          console.log('🏭 Adding real integration:', {
            added: { id: savedIntegration.id, type: savedIntegration.type },
            newTotal: updated.map(o => ({ id: o.id, type: o.type }))
          })
          return updated
        })
      })
      
      return { replacedTempId: tempIntegrationId, newIntegrationId: savedIntegration.id }
    } else {
      console.log('🏭 Processing existing integration update')
      // Update existing integration (preserving credentials)
      flushSync(() => {
        setOrgIntegrations(current => 
          current.map(int => int.id === savedIntegration.id ? savedIntegration : int)
        )
      })
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
