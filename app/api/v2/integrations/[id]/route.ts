import { integrationsService } from '@/lib/database/services'
import { authenticatedGet, authenticatedPut, authenticatedDelete } from '@/lib/api/authenticated-routes'
import type { UpdateIntegrationData } from '@/lib/types'

// Get integration - authenticated, organization-scoped
export const GET = authenticatedGet(
  integrationsService, 
  'getIntegrationById', 
  'Integration',
  { 
    requireAuth: true, 
    requireOrganization: true 
  }
)

// Update integration - authenticated, organization-scoped
export const PUT = authenticatedPut<typeof integrationsService, UpdateIntegrationData>(
  integrationsService,
  'updateIntegration',
  'Integration',
  { 
    requireAuth: true, 
    requireOrganization: true 
  }
)

// Delete integration - authenticated, organization-scoped
export const DELETE = authenticatedDelete(
  integrationsService,
  'deleteIntegration',
  'Integration',
  { 
    requireAuth: true, 
    requireOrganization: true 
  }
)
