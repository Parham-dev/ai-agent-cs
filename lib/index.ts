// Main Library Index
// Centralized exports for commonly used items only

// Types - export all types (most commonly imported)
export * from './types'

// Utils - export common utilities (frequently used across app)
export { cn } from './utils/cn'
export * from './utils/errors'

// Note: API client, database services, and specialized modules should be imported directly
// Example: import { apiClient } from '@/lib/api/authenticated-client'
// Example: import { agentsService } from '@/lib/database/services'