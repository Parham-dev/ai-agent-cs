'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'

/**
 * Hook to fetch and cache agent integrations
 * Uses SWR for caching and automatic revalidation
 */
export function useAgentIntegrations(agentId: string | null) {
  const { data: agentIntegrations = [], error, isLoading, mutate } = useSWR(
    agentId ? `agent-integrations-${agentId}` : null,
    async () => {
      if (!agentId) return []
      return api.agentIntegrations.getAgentIntegrations(agentId)
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // Cache for 30 seconds
      fallbackData: [],
    }
  )

  /**
   * Check if an integration is connected to the agent
   */
  const isIntegrationConnected = (integrationId: string) => {
    return agentIntegrations.some(ai => ai.integrationId === integrationId)
  }

  /**
   * Get the agent integration for a specific integration
   */
  const getAgentIntegration = (integrationId: string) => {
    return agentIntegrations.find(ai => ai.integrationId === integrationId)
  }

  /**
   * Add integration to agent
   */
  const addIntegration = async (integrationId: string, selectedTools: string[] = [], config?: Record<string, unknown>) => {
    const newAgentIntegration = await api.agentIntegrations.createAgentIntegration({
      agentId: agentId!,
      integrationId,
      selectedTools,
      config
    })
    
    // Optimistically update cache
    await mutate([...agentIntegrations, newAgentIntegration], false)
    return newAgentIntegration
  }

  /**
   * Remove integration from agent
   */
  const removeIntegration = async (agentIntegrationId: string) => {
    await api.agentIntegrations.deleteAgentIntegration(agentIntegrationId)
    
    // Optimistically update cache
    await mutate(
      agentIntegrations.filter(ai => ai.id !== agentIntegrationId),
      false
    )
  }

  return {
    agentIntegrations,
    isLoading,
    error,
    isIntegrationConnected,
    getAgentIntegration,
    addIntegration,
    removeIntegration,
    refreshAgentIntegrations: mutate,
  }
}