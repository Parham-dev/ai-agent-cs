// Main Library Index
// Centralized exports for commonly used items only

// Types - export all types (most commonly imported)
export * from './types'

// Utils - export common utilities (frequently used across app)
export { cn } from './utils/cn'
export * from './utils/errors'

// Context - export organization utilities (used by API client)
export * from './context/organization'

// Note: API client, database services, and specialized modules should be imported directly
// Example: import { apiClient } from '@/lib/api/client'
// Example: import { agentsService } from '@/lib/database/services'