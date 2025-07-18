import { integrationsService } from '@/lib/database/services'
import { authenticatedList, authenticatedPost } from '@/lib/api/authenticated-routes'
import type { CreateIntegrationData, IntegrationFilters } from '@/lib/types'

// List integrations - authenticated, rate-limited (org filtering handled by service)
export const GET = authenticatedList<typeof integrationsService, IntegrationFilters>(
  integrationsService, 
  'getIntegrations',
  { 
    requireAuth: true, 
    rateLimit: 'api' 
  }
)

// Create integration - authenticated, rate-limited (org context handled by service)
export const POST = authenticatedPost<typeof integrationsService, CreateIntegrationData>(
  integrationsService,
  'createIntegration',
  { 
    requireAuth: true, 
    rateLimit: 'api' 
  }
)
