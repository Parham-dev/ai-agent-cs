import { agentsService } from '@/lib/database/services'
import { authenticatedGet, authenticatedPut, authenticatedDelete } from '@/lib/api/authenticated-routes'
import type { UpdateAgentData } from '@/lib/types'

// Get agent - authenticated, organization-scoped
export const GET = authenticatedGet(
  agentsService, 
  'getAgentById', 
  'Agent',
  { 
    requireAuth: true, 
    requireOrganization: true 
  }
)

// Update agent - authenticated, organization-scoped, admin+ only
export const PUT = authenticatedPut<typeof agentsService, UpdateAgentData>(
  agentsService,
  'updateAgent',
  'Agent',
  { 
    requireAuth: true, 
    requireOrganization: true,
    roles: ['ADMIN', 'SUPER_ADMIN']
  }
)

// Delete agent - authenticated, organization-scoped, admin+ only
export const DELETE = authenticatedDelete(
  agentsService,
  'deleteAgent',
  'Agent',
  { 
    requireAuth: true, 
    requireOrganization: true,
    roles: ['ADMIN', 'SUPER_ADMIN']
  }
)
