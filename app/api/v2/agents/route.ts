import { agentsService } from '@/lib/database/services'
import { authenticatedList, authenticatedPost } from '@/lib/api/authenticated-routes'
import type { CreateAgentData, AgentFilters } from '@/lib/types'

// List agents - authenticated, organization-scoped, rate-limited
export const GET = authenticatedList<typeof agentsService, AgentFilters>(
  agentsService, 
  'getAgents',
  { 
    requireAuth: true, 
    requireOrganization: true, 
    rateLimit: 'api' 
  }
)

// Create agent - authenticated, organization-scoped, admin+ only, rate-limited
export const POST = authenticatedPost<typeof agentsService, CreateAgentData>(
  agentsService,
  'createAgent',
  { 
    requireAuth: true, 
    requireOrganization: true,
    roles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: 'api' 
  }
)
