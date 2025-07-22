'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import type { User } from '@/lib/types/auth'

/**
 * Hook to fetch and cache current user data
 * Uses SWR for caching and automatic revalidation
 */
export function useUser() {
  const { data: user, error, isLoading, mutate } = useSWR<User>(
    'current-user',
    () => api.user.getCurrentUser(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Cache for 1 minute
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      onError: (error) => {
        // Handle authentication errors gracefully
        console.warn('User fetch error:', error)
      }
    }
  )

  /**
   * Update user profile with optimistic updates
   */
  const updateProfile = async (data: { name: string }) => {
    try {
      // Optimistic update for immediate UI feedback
      if (user) {
        await mutate({ ...user, name: data.name }, false)
      }
      
      // Make API call
      const updatedUser = await api.user.updateProfile(data)
      
      // Trigger full revalidation to ensure cache is fresh
      await mutate()
      
      return { success: true, user: updatedUser }
    } catch (error) {
      // Revert optimistic update on error
      await mutate()
      throw error
    }
  }

  return {
    user: user || null,
    isLoading,
    error,
    updateProfile,
    refreshUser: mutate,
  }
}
