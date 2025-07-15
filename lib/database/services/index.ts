// Service Layer Exports
// This file provides a central point to import all database services

// Import JSON types to ensure they're available
import '../../types/prisma-json'

export { agentsService } from './agents.service'
export { organizationsService } from './organizations.service'
export { integrationsService } from './integrations.service'

// Export types for convenience
export type {
  Agent,
  AgentWithStats,
  CreateAgentData,
  UpdateAgentData,
  AgentFilters
} from './agents.service'

export type {
  Organization,
  OrganizationWithStats,
  OrganizationWithRelations,
  CreateOrganizationData,
  UpdateOrganizationData,
  OrganizationFilters
} from './organizations.service'

export type {
  Integration,
  IntegrationWithOrganization,
  CreateIntegrationData,
  UpdateIntegrationData,
  IntegrationFilters,
  IntegrationType,
  INTEGRATION_TYPES
} from './integrations.service'