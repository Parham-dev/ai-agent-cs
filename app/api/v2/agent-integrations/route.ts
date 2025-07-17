import { NextRequest, NextResponse } from 'next/server'
import { agentIntegrationsService } from '@/lib/database/services'
import { Api, withErrorHandling, validateMethod, ErrorCodes } from '@/lib/api'

export const GET = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { searchParams } = new URL(request.url)
  
  const filters = {
    agentId: searchParams.get('agentId') || undefined,
    integrationId: searchParams.get('integrationId') || undefined,
  }

  // If agentId is provided, get integrations for that agent
  if (filters.agentId) {
    const integrations = await agentIntegrationsService.getAgentIntegrations(filters.agentId)
    return Api.success(integrations)
  }

  // If integrationId is provided, get agents using that integration
  if (filters.integrationId) {
    const agents = await agentIntegrationsService.getIntegrationAgents(filters.integrationId)
    return Api.success(agents)
  }

  return Api.error(ErrorCodes.VALIDATION_ERROR, 'Must provide agentId or integrationId')
});

export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  const data = await request.json()
  
  // Validation for required fields
  const validationErrors: Record<string, string> = {};
  
  if (!data.agentId) {
    validationErrors.agentId = 'Agent ID is required';
  }
  
  if (!data.integrationId) {
    validationErrors.integrationId = 'Integration ID is required';
  }
  
  if (Object.keys(validationErrors).length > 0) {
    return Api.error(ErrorCodes.VALIDATION_ERROR, 'Validation failed', { errors: validationErrors });
  }

  const relationship = await agentIntegrationsService.createAgentIntegration({
    agentId: data.agentId,
    integrationId: data.integrationId,
    config: data.config || {},
    isEnabled: true,
    selectedTools: data.selectedTools || []
  })
  
  return Api.success({ relationship }, undefined, 201)
});

export const DELETE = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['DELETE']);
  if (methodError) return methodError;

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')
  const integrationId = searchParams.get('integrationId')
  
  if (!agentId || !integrationId) {
    return Api.error(ErrorCodes.VALIDATION_ERROR, 'Both agentId and integrationId are required');
  }

  await agentIntegrationsService.deleteAgentIntegration(agentId, integrationId)
  
  return Api.success({ message: 'Agent-integration relationship removed successfully' })
});
