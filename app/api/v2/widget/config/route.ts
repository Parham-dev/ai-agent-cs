import { NextRequest, NextResponse } from 'next/server'
import { widgetConfigsService } from '@/lib/database/services'
import { Api, validateMethod } from '@/lib/api'
import { withAuth } from '@/lib/auth/middleware'
import { createApiLogger } from '@/lib/utils/logger'
import type { CreateWidgetConfigData, AuthContext } from '@/lib/types'
import '@/lib/types/prisma-json'

/**
 * Widget Configuration API Endpoint
 * 
 * POST /api/v2/widget/config - Create or update widget configuration
 */
export const POST = withAuth(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
  const methodError = validateMethod(request, ['POST'])
  if (methodError) return methodError

  const logger = createApiLogger({
    endpoint: '/api/v2/widget/config',
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || 'unknown',
  })

  try {
    const data: CreateWidgetConfigData = await request.json()

    logger.info('Widget config creation request', {
      agentId: data.agentId,
      organizationId: context.user.organizationId || undefined,
      userId: context.user.id
    })

    // Validate required fields
    if (!data.agentId) {
      logger.warn('Widget config creation: missing agentId')
      return Api.validationError({
        agentId: 'Agent ID is required'
      })
    }

    // Create or update widget configuration
    const widgetConfig = await widgetConfigsService.upsertWidgetConfig(data)

    logger.info('Widget configuration created/updated successfully', {
      agentId: data.agentId,
      configId: widgetConfig.id
    })

    return Api.success(widgetConfig)

  } catch (error) {
    logger.error('Widget config creation failed', {}, error as Error)
    
    return Api.error(
      'INTERNAL_ERROR',
      'Failed to create widget configuration',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
})