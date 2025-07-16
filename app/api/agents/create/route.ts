import { NextRequest, NextResponse } from 'next/server'
import { agentsService } from '@/lib/database/services/agents.service'
import { Api, withErrorHandling, validateMethod } from '@/lib/api'

export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  const data = await request.json()
  
  // Validation for required fields
  const validationErrors: Record<string, string> = {};
  
  if (!data.organizationId) {
    validationErrors.organizationId = 'Organization ID is required';
  }
  
  if (!data.name?.trim()) {
    validationErrors.name = 'Agent name is required';
  }
  
  if (!data.instructions?.trim()) {
    validationErrors.instructions = 'Agent instructions are required';
  }
  
  if (Object.keys(validationErrors).length > 0) {
    return Api.validationError(validationErrors);
  }

  const agent = await agentsService.createAgent({
    organizationId: data.organizationId,
    name: data.name.trim(),
    instructions: data.instructions.trim(),
    tools: data.tools || [],
    model: data.model || 'gpt-4o',
    agentConfig: data.agentConfig || {},
    isActive: data.isActive ?? true
  })
  
  return Api.success({ agent }, undefined, 201)
});
