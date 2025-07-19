import { organizationsService } from '@/lib/database/services'
import { authenticatedList, authenticatedPost } from '@/lib/api/routes'
import type { CreateOrganizationData, OrganizationFilters } from '@/lib/types'

// List organizations - authenticated, super admin only, rate-limited
export const GET = authenticatedList<typeof organizationsService, OrganizationFilters>(
  organizationsService, 
  'getOrganizations',
  { 
    roles: ['SUPER_ADMIN'], 
    rateLimit: 'api' 
  }
)

// Create organization - authenticated, super admin only, rate-limited
export const POST = authenticatedPost<typeof organizationsService, CreateOrganizationData>(
  organizationsService,
  'createOrganization',
  { 
    roles: ['SUPER_ADMIN'], 
    rateLimit: 'api' 
  }
)
