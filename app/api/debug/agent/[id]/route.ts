import { NextRequest, NextResponse } from 'next/server'
import { agentsService } from '@/lib/database/services/agents.service'
import { Api, withErrorHandling, validateMethod } from '@/lib/api'

// Debug endpoint to get agent details including organization ID
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { id } = await params

  if (!id) {
    return Api.validationError({ id: 'Agent ID is required' });
  }

  const agent = await agentsService.getAgentById(id)

  if (!agent) {
    return Api.notFound('Agent', id);
  }

  return Api.success({ 
    agent: {
      id: agent.id,
      name: agent.name,
      organizationId: agent.organizationId,
      isActive: agent.isActive,
      model: agent.model,
      instructions: agent.instructions
    }
  })
});
