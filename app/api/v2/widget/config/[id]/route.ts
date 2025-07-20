import { NextRequest, NextResponse } from 'next/server'
import { widgetConfigsService, agentsService } from '@/lib/database/services'
import { Api, validateMethod } from '@/lib/api'
import { withAuthParams } from '@/lib/auth/middleware'
import { createApiLogger } from '@/lib/utils/logger'
import type { AuthContext } from '@/lib/types'
import '@/lib/types/prisma-json'

/**
 * Widget Configuration by Agent ID API Endpoint
 * 
 * GET /api/v2/widget/config/[agentId] - Get widget configuration for an agent
 */
export const GET = withAuthParams(async (
  request: NextRequest,
  context: AuthContext,
  routeContext: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const methodError = validateMethod(request, ['GET'])
  if (methodError) return methodError

  const logger = createApiLogger({
    endpoint: '/api/v2/widget/config/[agentId]',
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || 'unknown',
  })

  try {
    const params = await routeContext.params
    if (!params?.id) {
      return Api.error('VALIDATION_ERROR', 'Missing route parameters')
    }

    const agentId = params.id

    logger.info('Widget config fetch request', {
      agentId,
      organizationId: context.user.organizationId || undefined,
      userId: context.user.id
    })

    // Validate agent exists and belongs to user's organization
    const agent = await agentsService.getAgentById(agentId, context.user.organizationId!)
    if (!agent) {
      logger.warn('Widget config fetch: agent not found', { agentId })
      return Api.notFound('Agent', agentId)
    }

    // Get widget configuration
    const widgetConfig = await widgetConfigsService.getWidgetConfigByAgentId(agentId)

    if (!widgetConfig) {
      logger.info('Widget config not found for agent', { agentId })
      return Api.notFound('Widget configuration', agentId)
    }

    logger.info('Widget configuration fetched successfully', {
      agentId,
      configId: widgetConfig.id
    })

    return Api.success(widgetConfig)

  } catch (error) {
    logger.error('Widget config fetch failed', {}, error as Error)
    
    return Api.error(
      'INTERNAL_ERROR',
      'Failed to fetch widget configuration',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
})