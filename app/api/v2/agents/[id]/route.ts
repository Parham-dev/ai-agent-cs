import { agentsService } from '@/lib/database/services'
import { createGetHandler, createPutHandler, createDeleteHandler } from '@/lib/api/route-utils'
import type { UpdateAgentData } from '@/lib/types'

// Get single agent - simplified from ~20 lines to 1 line
export const GET = createGetHandler(agentsService, 'getAgentById', 'Agent')

// Update agent - simplified from ~30 lines to 1 line  
export const PUT = createPutHandler<typeof agentsService, UpdateAgentData>(
  agentsService,
  'updateAgent', 
  'Agent'
)

// Delete agent - simplified from ~15 lines to 1 line
export const DELETE = createDeleteHandler(agentsService, 'deleteAgent', 'Agent')
