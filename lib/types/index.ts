// Main Types Index
// Centralized exports for all type definitions

// Database types (Date objects, for internal use)
export type * from './database'

// API types (string dates, for client-server communication)
export * from './api'

// Auth types
export * from './auth'

// Common utility types
export type * from './common'

// Integration-specific types (keeping for compatibility)
export type { IntegrationCredentials, ConfiguredIntegration } from './integrations'

// Import JSON types to ensure they're available
import './prisma-json'