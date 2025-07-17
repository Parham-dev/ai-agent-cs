import { createListHandler, createPostHandler } from '@/lib/api/route-utils'
import { organizationsService } from '@/lib/database/services'
import type { CreateOrganizationData, OrganizationFilters } from '@/lib/types'

export const GET = createListHandler<typeof organizationsService, OrganizationFilters>(
  organizationsService,
  'getOrganizations'
)

export const POST = createPostHandler<typeof organizationsService, CreateOrganizationData>(
  organizationsService,
  'createOrganization'
)
