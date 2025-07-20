'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'

/**
 * Hook to fetch and cache a single agent by ID
 * Uses SWR for caching and automatic revalidation
 */
export function useAgent(agentId: string | null) {
  const { data: agent, error, isLoading, mutate } = useSWR(
    agentId ? `agent-${agentId}` : null,
    async () => {
      if (!agentId) return null
      return api.agents.getAgent(agentId)
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10000, // Cache for 10 seconds
      errorRetryCount: 3, // Retry up to 3 times on error
      errorRetryInterval: 1000, // Wait 1 second between retries
      fallbackData: undefined,
    }
  )

  return {
    agent,
    isLoading,
    error,
    refreshAgent: mutate,
  }
}

/**
 * Hook to fetch and cache all agents for current organization
 */
export function useAgents(filters?: { search?: string; isActive?: boolean; limit?: number }) {
  const { data: agents = [], error, isLoading, mutate } = useSWR(
    ['agents', filters],
    () => api.agents.getAgents(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // Cache for 30 seconds
      fallbackData: [],
    }
  )

  return {
    agents,
    isLoading,
    error,
    refreshAgents: mutate,
  }
}