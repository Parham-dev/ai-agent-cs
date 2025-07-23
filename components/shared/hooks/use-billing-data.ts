import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import type { BillingData, UsageRecord, Transaction } from '@/lib/api/services/organization-client'

// Custom fetchers using the authenticated API client
const billingFetcher = () => api.organization.getBilling()
const usageFetcher = () => api.organization.getUsage(50)
const transactionsFetcher = () => api.organization.getTransactions(50)

export function useBillingData() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch billing dashboard data
  const { 
    data: billingData, 
    error: billingError, 
    mutate: mutateBilling,
    isLoading: billingLoading
  } = useSWR<BillingData>('organization-billing', billingFetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true
  })

  // Fetch usage data
  const { 
    data: usageResponse, 
    error: usageError,
    mutate: mutateUsage,
    isLoading: usageLoading
  } = useSWR<{ usage: UsageRecord[] }>('organization-usage', usageFetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true
  })

  // Fetch transactions
  const { 
    data: transactionResponse, 
    error: transactionError,
    mutate: mutateTransactions,
    isLoading: transactionsLoading
  } = useSWR<{ transactions: Transaction[] }>('organization-transactions', transactionsFetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true
  })

  // Determine overall loading and error states
  useEffect(() => {
    const loading = billingLoading || usageLoading || transactionsLoading
    const anyError = billingError || usageError || transactionError

    setIsLoading(loading)
    setError(anyError ? 'Failed to load billing data. Please try again.' : null)
  }, [billingLoading, usageLoading, transactionsLoading, billingError, usageError, transactionError])

  const refreshData = async () => {
    try {
      await Promise.all([
        mutateBilling(),
        mutateUsage(),
        mutateTransactions()
      ])
    } catch (err) {
      console.error('Failed to refresh billing data:', err)
      setError('Failed to refresh data')
    }
  }

  return {
    billingData,
    usageData: usageResponse?.usage || [],
    transactions: transactionResponse?.transactions || [],
    isLoading,
    error,
    refreshData
  }
}