import { organizationsService } from '@/lib/database/services'
import { authenticatedGet, authenticatedPut, authenticatedDelete } from '@/lib/api/authenticated-routes'
import type { UpdateOrganizationData } from '@/lib/types'

// Get organization - authenticated, super admin only
export const GET = authenticatedGet(
  organizationsService, 
  'getOrganizationById', 
  'Organization',
  { 
    requireAuth: true, 
    roles: ['SUPER_ADMIN'] 
  }
)

// Update organization - authenticated, super admin only
export const PUT = authenticatedPut<typeof organizationsService, UpdateOrganizationData>(
  organizationsService,
  'updateOrganization',
  'Organization',
  { 
    requireAuth: true, 
    roles: ['SUPER_ADMIN'] 
  }
)

// Delete organization - authenticated, super admin only
export const DELETE = authenticatedDelete(
  organizationsService,
  'deleteOrganization',
  'Organization',
  { 
    requireAuth: true, 
    roles: ['SUPER_ADMIN'] 
  }
)
