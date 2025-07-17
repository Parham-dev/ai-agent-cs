import { createGetHandler, createPutHandler, createDeleteHandler } from '@/lib/api/route-utils'
import { organizationsService } from '@/lib/database/services'
import type { UpdateOrganizationData } from '@/lib/types'

export const GET = createGetHandler(
  organizationsService,
  'getOrganizationById',
  'organization'
)

export const PUT = createPutHandler<typeof organizationsService, UpdateOrganizationData>(
  organizationsService,
  'updateOrganization',
  'Organization'
)

export const DELETE = createDeleteHandler(
  organizationsService,
  'deleteOrganization',
  'Organization deleted successfully'
)
