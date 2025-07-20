'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'

// Preloader hook to cache integrations data early in the wizard flow
export function usePreloadIntegrations() {
  const { data, error } = useSWR(
    'integrations',
    () => api.integrations.getIntegrations({ isActive: true }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
      fallbackData: [],
    }
  )

  return { data, error }
}

// Alternative: Preload function that can be called imperatively
export function preloadIntegrations() {
  // This will populate the SWR cache without rendering
  return api.integrations.getIntegrations({ isActive: true })
}