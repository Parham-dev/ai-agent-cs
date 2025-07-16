import { NextRequest, NextResponse } from 'next/server'
import { Api, withErrorHandling, validateMethod } from '@/lib/api'
import { createApiLogger } from '@/lib/utils/logger'

// Import available tools for each integration type
import { ALL_TOOLS as SHOPIFY_TOOLS } from '@/lib/mcp/servers/shopify/tools'

export const GET = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { searchParams } = new URL(request.url)
  const integrationType = searchParams.get('type')
  
  const logger = createApiLogger({
    endpoint: '/api/integrations/tools',
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || 'unknown'
  });

  if (!integrationType) {
    return Api.validationError({ type: 'Integration type is required' });
  }

  try {
    logger.debug('Fetching tools for integration type', { integrationType });

    let tools: Array<{ id: string; name: string; description: string }> = [];

    switch (integrationType) {
      case 'shopify':
        tools = SHOPIFY_TOOLS.map(tool => ({
          id: tool.name,
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
        logger.warn('Unknown integration type', { integrationType });
        tools = [];
    }

    logger.info('Successfully fetched tools', { 
      integrationType, 
      toolsCount: tools.length 
    });

    return Api.success({ tools });

  } catch (error) {
    logger.error('Failed to fetch integration tools', {}, error as Error);
    throw error;
  }
});
