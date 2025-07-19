import { agentsService } from '@/lib/database/services'
import { authenticatedList, authenticatedPost } from '@/lib/api/routes'
import type { CreateAgentData, AgentFilters } from '@/lib/types'

// List agents - ultra simple with auto org scoping
export const GET = authenticatedList<typeof agentsService, AgentFilters>(
  agentsService, 
  'getAgents',
  { 
    rateLimit: 'api' 
  }
)

// Create agent - admin+ only, auto org scoping
export const POST = authenticatedPost<typeof agentsService, CreateAgentData>(
  agentsService,
  'createAgent',
  { 
    roles: ['ADMIN', 'SUPER_ADMIN'],
    rateLimit: 'api' 
  }
)
