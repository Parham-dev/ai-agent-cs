import { agentsService } from '@/lib/database/services'
import { authenticatedList, authenticatedPost } from '@/lib/api/authenticated-routes'
import type { CreateAgentData, AgentFilters } from '@/lib/types'

// List agents - authenticated, rate-limited (org filtering handled by service)
export const GET = authenticatedList<typeof agentsService, AgentFilters>(
  agentsService, 
  'getAgents',
  { 
    requireAuth: true, 
    rateLimit: 'api' 
  }
)

// Create agent - authenticated, admin+ only, rate-limited
export const POST = authenticatedPost<typeof agentsService, CreateAgentData>(
  agentsService,
  'createAgent',
  { 
    requireAuth: true, 
    roles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: 'api' 
  }
)
