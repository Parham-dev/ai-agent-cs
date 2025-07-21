import { NextRequest } from 'next/server'
import { agentIntegrationsService } from '@/lib/database/services'
import { ApiResponseHelper as Api, validateMethod, withErrorHandling } from '@/lib/api/helpers'
import type { CreateAgentIntegrationData, UpdateAgentIntegrationData } from '@/lib/types'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')
  const integrationId = searchParams.get('integrationId')

  // If agentId is provided, get integrations for that agent
  if (agentId) {
    const integrations = await agentIntegrationsService.getAgentIntegrations(agentId)
    return Api.success(integrations)
  }

  // If integrationId is provided, get agents using that integration
  if (integrationId) {
    const agents = await agentIntegrationsService.getIntegrationAgents(integrationId)
    return Api.success(agents)
  }

  return Api.error('VALIDATION_ERROR', 'Must provide agentId or integrationId')
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const methodError = validateMethod(request, ['POST'])
  if (methodError) return methodError

  const data = await request.json() as CreateAgentIntegrationData
  
  // Validation for required fields
  if (!data.agentId || !data.integrationId) {
    return Api.error('VALIDATION_ERROR', 'Both agentId and integrationId are required')
  }

  const relationship = await agentIntegrationsService.createAgentIntegration({
    agentId: data.agentId,
    integrationId: data.integrationId,
    config: data.config || {},
    isEnabled: true,
    selectedTools: data.selectedTools || []
  })
  
  return Api.success({ relationship }, undefined, 201)
})

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const methodError = validateMethod(request, ['PUT'])
  if (methodError) return methodError

  const data = await request.json() as UpdateAgentIntegrationData & { agentId: string; integrationId: string }
  
  // Validation for required fields
  if (!data.agentId || !data.integrationId) {
    return Api.error('VALIDATION_ERROR', 'Both agentId and integrationId are required')
  }

  const relationship = await agentIntegrationsService.updateAgentIntegration(
    data.agentId, 
    data.integrationId, 
    {
      selectedTools: data.selectedTools,
      config: data.config,
      isEnabled: data.isEnabled
    }
  )
  
  return Api.success({ relationship })
})

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const methodError = validateMethod(request, ['DELETE'])
  if (methodError) return methodError

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')
  const integrationId = searchParams.get('integrationId')
  
  if (!agentId || !integrationId) {
    return Api.error('VALIDATION_ERROR', 'Both agentId and integrationId are required')
  }

  await agentIntegrationsService.deleteAgentIntegration(agentId, integrationId)
  return Api.success({ message: 'Agent-integration relationship removed successfully' })
})
