import { integrationsService } from '@/lib/database/services'
import { createGetHandler, createPutHandler, createDeleteHandler } from '@/lib/api/route-utils'
import type { UpdateIntegrationData } from '@/lib/types'

// Get single integration - simplified from ~20 lines to 1 line
export const GET = createGetHandler(integrationsService, 'getIntegrationById', 'Integration')

// Update integration - simplified from ~35 lines to 1 line  
export const PUT = createPutHandler<typeof integrationsService, UpdateIntegrationData>(
  integrationsService,
  'updateIntegration', 
  'Integration'
)

// Delete integration - simplified from ~15 lines to 1 line
export const DELETE = createDeleteHandler(integrationsService, 'deleteIntegration', 'Integration')
