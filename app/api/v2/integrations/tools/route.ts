import { NextRequest } from 'next/server'
import { ApiResponseHelper as Api, validateMethod } from '@/lib/api/helpers'
import { withErrorHandling } from '@/lib/api/error-handling'
import { createApiLogger } from '@/lib/utils/logger'

// Import available tools for each integration type
import { ALL_TOOLS as SHOPIFY_TOOLS } from '@/lib/mcp/servers/shopify/tools/index'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { searchParams } = new URL(request.url)
  const integrationType = searchParams.get('type')
  
  const logger = createApiLogger({
    endpoint: '/api/v2/integrations/tools',
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || 'unknown'
  });

  if (!integrationType) {
    return Api.error('VALIDATION_ERROR', 'Integration type is required', { errors: { type: 'Integration type is required' } });
  }

  logger.debug('Fetching tools for integration type', { integrationType });

  let tools: Array<{ name: string; description: string }> = [];

  switch (integrationType) {
    case 'shopify':
      tools = SHOPIFY_TOOLS.map(tool => ({
        name: tool.name.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()), // Convert camelCase to Title Case
        description: tool.description || 'No description available'
      }));
      break;
    
    case 'stripe':
      // TODO: Add Stripe tools when implemented
      tools = [];
      break;
      
    case 'custom':
      // TODO: Add custom tools when implemented
      tools = [];
      break;
      
    default:
      logger.warn('Unknown integration type requested', { integrationType });
      return Api.error('VALIDATION_ERROR', 'Unknown integration type', { type: integrationType });
  }

  logger.debug('Tools fetched successfully', { integrationType, toolCount: tools.length });

  return Api.success(tools);
});
