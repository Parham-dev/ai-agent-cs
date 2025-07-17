import { agentsService } from '@/lib/database/services'
import { createListHandler, createPostHandler } from '@/lib/api/route-utils'
import type { CreateAgentData, AgentFilters } from '@/lib/types'

// List agents - simplified from ~22 lines to 1 line
export const GET = createListHandler<typeof agentsService, AgentFilters>(
  agentsService, 
  'getAgents'
)

// Create agent - simplified from ~37 lines to 1 line  
export const POST = createPostHandler<typeof agentsService, CreateAgentData>(
  agentsService,
  'createAgent'
)
