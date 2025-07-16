// V2 Database Services - Centralized exports
// Following the new normalized schema

export { agentsServiceV2 } from './agents.service'
export { integrationsServiceV2 } from './integrations.service'
export { agentIntegrationsServiceV2 } from './agent-integrations.service'

// Re-export types for convenience
export type * from '@/lib/types/v2/schema'
