import { integrationsService } from '@/lib/database/services'
import { authenticatedList, authenticatedPost } from '@/lib/api/authenticated-routes'
import type { CreateIntegrationData, IntegrationFilters } from '@/lib/types'

// List integrations - authenticated, organization-scoped, rate-limited
export const GET = authenticatedList<typeof integrationsService, IntegrationFilters>(
  integrationsService, 
  'getIntegrations',
  { 
    requireAuth: true, 
    requireOrganization: true, 
    rateLimit: 'api' 
  }
)

// Create integration - authenticated, organization-scoped, rate-limited
export const POST = authenticatedPost<typeof integrationsService, CreateIntegrationData>(
  integrationsService,
  'createIntegration',
  { 
    requireAuth: true, 
    requireOrganization: true, 
    rateLimit: 'api' 
  }
)
