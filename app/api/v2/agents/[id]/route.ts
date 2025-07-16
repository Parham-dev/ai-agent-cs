import { NextRequest, NextResponse } from 'next/server'
import { agentsServiceV2 } from '@/lib/database/services/v2/agents.service'
import { Api, withErrorHandling, validateMethod, ErrorCodes } from '@/lib/api'

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { id } = await params;
  const agent = await agentsServiceV2.getAgentById(id)
  
  if (!agent) {
    return Api.error(ErrorCodes.AGENT_NOT_FOUND, 'Agent not found');
  }
  
  return Api.success({ agent })
});

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['PUT']);
  if (methodError) return methodError;

  const { id } = await params;
  const data = await request.json()
  
  // Validation for fields that can be updated
  const validationErrors: Record<string, string> = {};
  
  if (data.name !== undefined && !data.name?.trim()) {
    validationErrors.name = 'Agent name cannot be empty';
  }

  if (data.systemPrompt !== undefined && !data.systemPrompt?.trim()) {
    validationErrors.systemPrompt = 'System prompt cannot be empty';
  }
  
  if (Object.keys(validationErrors).length > 0) {
    return Api.error(ErrorCodes.VALIDATION_ERROR, 'Validation failed', { errors: validationErrors });
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt.trim();

  const agent = await agentsServiceV2.updateAgent(id, updateData)
  
  return Api.success({ agent })
});

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['DELETE']);
  if (methodError) return methodError;

  const { id } = await params;
  await agentsServiceV2.deleteAgent(id)
  
  return Api.success({ message: 'Agent deleted successfully' })
});
