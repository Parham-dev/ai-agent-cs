import { NextRequest, NextResponse } from 'next/server'
import { agentsService } from '@/lib/database/services'
import { Api, withErrorHandling, validateMethod, ErrorCodes } from '@/lib/api'

export const GET = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { searchParams } = new URL(request.url)
  
  const filters = {
    organizationId: searchParams.get('organizationId') || undefined,
    search: searchParams.get('search') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
  }

  const agents = await agentsService.getAgents(filters)
  
  return Api.success(agents)
});

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

  if (!data.systemPrompt?.trim()) {
    validationErrors.systemPrompt = 'System prompt is required';
  }
  
  if (Object.keys(validationErrors).length > 0) {
    return Api.error(ErrorCodes.VALIDATION_ERROR, 'Validation failed', { errors: validationErrors });
  }

  const agent = await agentsService.createAgent({
    organizationId: data.organizationId,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    systemPrompt: data.systemPrompt.trim(),
  })
  
  return Api.success(agent, undefined, 201)
});
