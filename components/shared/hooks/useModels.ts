'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'

/**
 * Hook to fetch and cache available AI models
 * Uses SWR for caching and automatic revalidation
 */
export function useModels() {
  const { data: models = [], error, isLoading, mutate } = useSWR(
    'models',
    () => api.models.getModels(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Cache for 5 minutes (models rarely change)
      fallbackData: [], // Immediate fallback to prevent loading state
    }
  )

  return {
    models,
    isLoading,
    error,
    refreshModels: mutate,
  }
}

/**
 * Hook to get a specific model by value
 */
export function useModel(modelValue: string) {
  const { models, isLoading, error } = useModels()
  
  const model = models.find(m => m.value === modelValue)
  
  return {
    model,
    isLoading,
    error,
  }
}