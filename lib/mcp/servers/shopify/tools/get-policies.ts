import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  MCPToolContext, 
  MCPToolResponse,
  ShopifyPolicy
} from '../types';

/**
 * Get Policies Tool
 * Gets store legal policies (privacy, terms of service, refund, etc.)
 */
export const getPoliciesTool = {
  name: 'getPolicies',
  description: 'Get store legal policies (privacy, terms of service, refund, etc.)',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },

  async handler(
    params: Record<string, unknown>,
    context: MCPToolContext
  ): Promise<MCPToolResponse<{ policies: ShopifyPolicy[] }>> {
    const startTime = Date.now();
    
    try {
      logger.debug('Get policies tool called', { 
        requestId: context.requestId
      });

      // Initialize Shopify client
      const client = new ShopifyMCPClient(context.credentials, context.settings);

      // Get policies
      const policies = await client.getPolicies();

      logger.info('Get policies completed successfully', {
        requestId: context.requestId,
        policyCount: policies.length,
        executionTime: Date.now() - startTime
      });

      return {
        success: true,
        data: { policies },
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('Get policies tool failed', {
        requestId: context.requestId
      }, error as Error);

      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'GET_POLICIES_ERROR',
          message: (errorObj.message as string) || 'Failed to get policies',
          details: errorObj.context
        },
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };
    }
  }
};