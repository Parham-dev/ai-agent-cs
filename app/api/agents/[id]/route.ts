import { NextRequest, NextResponse } from 'next/server'
import { agentsService } from '@/lib/database/services/agents.service'
import { Api, withErrorHandling, validateMethod } from '@/lib/api'

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

  return Api.success({ agent })
});

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['PATCH']);
  if (methodError) return methodError;

  const { id } = await params
  const data = await request.json()

  if (!id) {
    return Api.validationError({ id: 'Agent ID is required' });
  }

  const agent = await agentsService.updateAgent(id, data)
  
  return Api.success({ agent })
});

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['DELETE']);
  if (methodError) return methodError;

  const { id } = await params

  if (!id) {
    return Api.validationError({ id: 'Agent ID is required' });
  }

  await agentsService.deleteAgent(id)
  
  return Api.success({ message: 'Agent deleted successfully' })
});
