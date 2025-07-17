import { integrationsService } from '@/lib/database/services'
import { createListHandler, createPostHandler } from '@/lib/api/route-utils'
import type { CreateIntegrationData, IntegrationFilters } from '@/lib/types'

// List integrations - simplified from ~24 lines to 1 line
export const GET = createListHandler<typeof integrationsService, IntegrationFilters>(
  integrationsService, 
  'getIntegrations'
)

// Create integration - simplified from ~41 lines to 1 line  
export const POST = createPostHandler<typeof integrationsService, CreateIntegrationData>(
  integrationsService,
  'createIntegration'
)
