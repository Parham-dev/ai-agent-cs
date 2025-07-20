'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'

/**
 * Hook to fetch and cache organization settings for agent creation
 * Uses SWR for caching and automatic revalidation
 */
export function useOrganizationSettings() {
  const { data: settings, error, isLoading, mutate } = useSWR(
    'organization-settings',
    () => api.organization.getSettings(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 600000, // Cache for 10 minutes (settings change infrequently)
      fallbackData: undefined, // No fallback for settings (need to wait for API)
    }
  )

  return {
    settings,
    isLoading,
    error,
    refreshSettings: mutate,
  }
}

/**
 * Hook to get default values for agent creation from organization settings
 */
export function useAgentDefaults() {
  const { settings, isLoading, error } = useOrganizationSettings()
  
  if (!settings) {
    return { defaults: null, isLoading, error }
  }
  
  const defaults = {
    model: settings.defaultModel,
    temperature: settings.defaultTemperature,
    maxTokens: settings.defaultMaxTokens,
    systemPrompt: settings.defaultInstructions,
    outputType: settings.defaultOutputType,
    toolChoice: settings.defaultToolChoice,
  }
  
  return {
    defaults,
    isLoading,
    error,
  }
}