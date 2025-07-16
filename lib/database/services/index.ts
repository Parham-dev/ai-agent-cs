// Service Layer Exports
// This file provides a central point to import all database services

// Import JSON types to ensure they're available
import '../../types/prisma-json'

export { organizationsService } from './organizations.service'

// Export types for convenience
export type {
  Organization,
  OrganizationWithStats,
  OrganizationWithRelations,
  CreateOrganizationData,
  UpdateOrganizationData,
  OrganizationFilters
} from './organizations.service'