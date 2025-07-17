import { agentsService } from '@/lib/database/services'
import { createPutHandler, createDeleteHandler } from '@/lib/api/route-utils'
import { withErrorHandling } from '@/lib/api/error-handling'
import { validateMethod } from '@/lib/api/helpers'
import { ApiResponseHelper as Api } from '@/lib/api/helpers'
import type { UpdateAgentData } from '@/lib/types'

// Get single agent - return agent directly with proper date serialization
export const GET = withErrorHandling(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const methodError = validateMethod(request, ['GET'])
  if (methodError) return methodError

  const { id } = await context.params
  const agent = await agentsService.getAgentById(id)
  
  if (!agent) {
    return Api.notFound('Agent', id)
  }
  
  // Simple date serialization - no field transformation needed
  const serializedAgent = {
    ...agent,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
    agentIntegrations: agent.agentIntegrations?.map(ai => ({
      ...ai,
      createdAt: ai.createdAt.toISOString(),
      updatedAt: ai.updatedAt.toISOString()
    }))
  }
  
  return Api.success(serializedAgent)
})

// Update agent - simplified from ~30 lines to 1 line  
export const PUT = createPutHandler<typeof agentsService, UpdateAgentData>(
  agentsService,
  'updateAgent', 
  'Agent'
)

// Delete agent - simplified from ~15 lines to 1 line
export const DELETE = createDeleteHandler(agentsService, 'deleteAgent', 'Agent')
