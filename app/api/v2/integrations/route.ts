import { integrationsService } from '@/lib/database/services'
import { authenticatedList, authenticatedPost } from '@/lib/api/routes'
import type { CreateIntegrationData, IntegrationFilters } from '@/lib/types'

// List integrations - authenticated, rate-limited (org filtering handled by service)
export const GET = authenticatedList<typeof integrationsService, IntegrationFilters>(
  integrationsService, 
  'getIntegrations',
  { 
    rateLimit: 'api' 
  }
)

// Create integration - authenticated, rate-limited (org context handled by service)
export const POST = authenticatedPost<typeof integrationsService, CreateIntegrationData>(
  integrationsService,
  'createIntegration',
  { 
    rateLimit: 'api' 
  }
)
