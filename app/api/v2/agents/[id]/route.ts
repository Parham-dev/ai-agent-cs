import { agentsService } from '@/lib/database/services'
import { authenticatedGet, authenticatedPut, authenticatedDelete } from '@/lib/api/routes'
import type { UpdateAgentData } from '@/lib/types'

// Get agent - authenticated, with organization access validation
export const GET = authenticatedGet(
  agentsService, 
  'getAgentById', 
  'Agent',
  {}
)

// Update agent - authenticated, organization-scoped, admin+ only
export const PUT = authenticatedPut<typeof agentsService, UpdateAgentData>(
  agentsService,
  'updateAgent',
  'Agent',
  { 
    roles: ['ADMIN', 'SUPER_ADMIN']
  }
)

// Delete agent - authenticated, organization-scoped, admin+ only
export const DELETE = authenticatedDelete(
  agentsService,
  'deleteAgent',
  'Agent',
  { 
    roles: ['ADMIN', 'SUPER_ADMIN']
  }
)
