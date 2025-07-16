import { NextRequest, NextResponse } from 'next/server'
import { integrationsService } from '@/lib/database/services/integrations.service'
import { Api, withErrorHandling } from '@/lib/api'
import { createApiLogger } from '@/lib/utils/logger'

// This is a temporary endpoint to quickly create a test Shopify integration
export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  const { organizationId } = await request.json()
  
  const logger = createApiLogger({
    endpoint: '/api/integrations/test-shopify',
    organizationId,
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || 'unknown',
  });
  
  logger.info('Test Shopify endpoint called', { organizationId });
  
  if (!organizationId) {
    logger.warn('Test Shopify request validation failed', { 
      hasOrganizationId: !!organizationId 
    });
    return Api.validationError({ 
      organizationId: !organizationId ? 'Organization ID is required' : undefined
    });
  }

  try {
    logger.debug('Creating test Shopify integration');
    
    // Create a test Shopify integration
    const integration = await integrationsService.createIntegration({
      organizationId,
      type: 'shopify',
      name: 'Test Shopify Store',
      credentials: {
        storeName: 'demo-store',
        accessToken: 'test-token-123' // This would be a real token in production
      },
      settings: {
        syncProducts: true,
        syncInventory: true
      },
      isActive: true
    })
    
    logger.info('Test Shopify integration created successfully', { 
      integrationId: integration.id
    });
    
    return Api.success({ 
      integration,
      message: 'Test Shopify integration created successfully! Your agent can now use Shopify tools.'
    })
  } catch (error) {
    logger.error('Failed to create test Shopify integration', {}, error as Error);
    throw error;
  }
});
