'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { ApiIntegration } from '@/lib/types'

// Simplified hook with SWR as single source of truth
export function useIntegrations() {
  // Server state - single source of truth with SWR
  const { data: orgIntegrations = [], error, mutate, isLoading } = useSWR(
    'integrations',
    () => api.integrations.getIntegrations({ isActive: true }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // Cache for 30 seconds
      fallbackData: [], // Immediate fallback to prevent loading state
      keepPreviousData: true, // Keep showing previous data while loading new
    }
  )

  // UI-only temp integrations during creation flow
  const [tempIntegrations, setTempIntegrations] = useState<ApiIntegration[]>([])

  // Auto-cleanup: Remove temp integrations when real ones of same type exist
  useEffect(() => {
    if (orgIntegrations.length > 0) {
      const realTypes = new Set(orgIntegrations.map(int => int.type))
      setTempIntegrations(prev => prev.filter(temp => !realTypes.has(temp.type)))
    }
  }, [orgIntegrations])

  // Combine integrations and remove duplicates (real integrations take precedence over temp)
  const allIntegrations = (() => {
    const realTypes = new Set(orgIntegrations.map(int => int.type))
    const filteredTempIntegrations = tempIntegrations.filter(temp => !realTypes.has(temp.type))
    return [...orgIntegrations, ...filteredTempIntegrations]
  })()

  const addTempIntegration = (type: string): ApiIntegration => {
    // Check if integration of this type already exists (real or temp)
    const existingTypes = allIntegrations.map(int => int.type)
    
    // For non-custom MCP integrations, enforce single instance
    if (type !== 'custom-mcp' && existingTypes.includes(type)) {
      throw new Error(`Integration of type '${type}' already exists`)
    }

    // Generate unique name for custom MCP integrations
    let integrationName = type.charAt(0).toUpperCase() + type.slice(1)
    if (type === 'custom-mcp') {
      const existingCustomMcps = allIntegrations.filter(int => int.type === 'custom-mcp')
      const count = existingCustomMcps.length + 1
      integrationName = `Custom MCP ${count}`
    }

    const tempIntegration: ApiIntegration = {
      id: `temp-${type}-${Date.now()}`,
      name: integrationName,
      type,
      description: `${type} integration`,
      isActive: true,
      credentials: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: 'temp'
    }
    
    setTempIntegrations(prev => [...prev, tempIntegration])
    return tempIntegration
  }

  const saveIntegrationCredentials = async (
    integrationData: ApiIntegration | { name: string; type: string; credentials: Record<string, unknown>; description?: string },
    tempId?: string
  ): Promise<ApiIntegration> => {
    try {
      console.log('🏪 saveIntegrationCredentials called', {
        hasId: 'id' in integrationData,
        integrationId: 'id' in integrationData ? integrationData.id : 'new',
        tempId,
        type: integrationData.type,
        name: integrationData.name
      })

      // Optimistic update for immediate UI feedback
      if (tempId?.startsWith('temp-')) {
        console.log('🏪 Removing temp integration from UI state', { tempId })
        setTempIntegrations(prev => prev.filter(temp => temp.id !== tempId))
      }

      // If integrationData is already a saved integration, just return it
      if ('id' in integrationData && !integrationData.id.startsWith('temp-')) {
        console.log('🏪 Integration already saved, refreshing cache', { id: integrationData.id })
        await mutate() // Refresh SWR cache
        return integrationData
      }

      // Otherwise, create new integration
      console.log('🏪 Creating new integration via API...', {
        name: integrationData.name,
        type: integrationData.type,
        hasCredentials: !!integrationData.credentials
      })
      
      const savedIntegration = await api.integrations.createIntegration({
        name: integrationData.name,
        type: integrationData.type,
        credentials: integrationData.credentials,
        description: integrationData.description || undefined
      })
      
      console.log('🏪 Integration created successfully, refreshing SWR cache', { 
        id: savedIntegration.id,
        name: savedIntegration.name,
        type: savedIntegration.type
      })
      
      // SWR automatically refreshes data, ensuring all components get updated
      await mutate()
      console.log('🏪 SWR cache refreshed')
      
      return savedIntegration
    } catch (error) {
      console.error('🏪 Failed to save integration credentials:', error)
      
      // Rollback optimistic update on error
      if (tempId?.startsWith('temp-')) {
        console.log('🏪 Rolling back temp integration removal', { tempId })
        const tempIntegration = tempIntegrations.find(t => t.id === tempId)
        if (tempIntegration) {
          setTempIntegrations(prev => [...prev, tempIntegration])
        }
      }
      
      console.error('Failed to save integration:', error)
      toast.error('Failed to save integration')
      throw error
    }
  }

  const getAvailableTypes = <T extends string>(availableTypes: readonly T[]): T[] => {
    const existingTypes = allIntegrations.map(int => int.type)
    return availableTypes.filter(type => {
      // Always allow custom-mcp to be added (multiple instances allowed)
      if (type === 'custom-mcp') {
        return true
      }
      // For other types, enforce single instance
      return !existingTypes.includes(type)
    })
  }

  return {
    orgIntegrations,
    tempIntegrations,
    allIntegrations,
    isLoading,
    error,
    addTempIntegration,
    saveIntegrationCredentials,
    getAvailableTypes,
    refreshIntegrations: mutate,
  }
}