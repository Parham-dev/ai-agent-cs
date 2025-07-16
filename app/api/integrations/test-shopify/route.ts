import { NextRequest, NextResponse } from 'next/server'
import { integrationsService } from '@/lib/database/services/integrations.service'
import { Api, withErrorHandling } from '@/lib/api'

// This is a temporary endpoint to quickly create a test Shopify integration
export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  const { agentId, organizationId } = await request.json()
  
  console.log('Test Shopify endpoint called with:', { agentId, organizationId });
  
  if (!agentId || !organizationId) {
    console.log('Validation failed:', { agentId: !!agentId, organizationId: !!organizationId });
    return Api.validationError({ 
      agentId: !agentId ? 'Agent ID is required' : undefined,
      organizationId: !organizationId ? 'Organization ID is required' : undefined
    });
  }

  try {
    console.log('Creating test Shopify integration...');
    
    // Create a test Shopify integration
    const integration = await integrationsService.createIntegration({
      organizationId,
      agentId,
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
    
    console.log('Integration created:', { id: integration.id, agentId: integration.agentId });
    
    return Api.success({ 
      integration,
      message: 'Test Shopify integration created successfully! Your agent can now use Shopify tools.'
    })
  } catch (error) {
    console.error('Error creating integration:', error);
    throw error;
  }
});
