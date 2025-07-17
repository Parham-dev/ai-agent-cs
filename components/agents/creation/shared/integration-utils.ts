import { ShoppingBag, CreditCard, Settings } from 'lucide-react'

// Get available integration types as options for dropdowns
export const getAvailableTypes = (types: readonly string[]) => {
  return types.map(type => ({
    value: type,
    label: getIntegrationDisplayName(type)
  }))
}

// Get display name for integration type
export const getIntegrationDisplayName = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Get icon for integration type
export const getIntegrationIcon = (type: string) => {
  switch (type) {
    case 'shopify':
      return ShoppingBag
    case 'stripe':
      return CreditCard
    default:
      return Settings
  }
}

// Get integration theme colors
export const getIntegrationColors = (type: string) => {
  switch (type) {
    case 'shopify':
      return {
        primary: 'green',
        light: 'border-green-500 bg-green-50 dark:bg-green-900/20',
        hover: 'hover:border-green-300'
      }
    case 'stripe':
      return {
        primary: 'blue',
        light: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
        hover: 'hover:border-blue-300'
      }
    default:
      return {
        primary: 'gray',
        light: 'border-gray-500 bg-gray-50 dark:bg-gray-900/20',
        hover: 'hover:border-gray-300'
      }
  }
}
