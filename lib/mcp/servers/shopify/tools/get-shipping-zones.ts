import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  MCPToolContext, 
  MCPToolResponse,
  ShopifyShippingZone
} from '../types';

export const getShippingZonesTool = {
  name: 'getShippingZones',
  description: 'Get shipping zones and rates configured for the store',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },

  async handler(
    params: Record<string, unknown>,
    context: MCPToolContext
  ): Promise<MCPToolResponse<{ shippingZones: ShopifyShippingZone[] }>> {
    const startTime = Date.now();
    
    try {
      const client = new ShopifyMCPClient(context.credentials, context.settings);
      const shippingZones = await client.getShippingZones();

      return {
        success: true,
        data: { shippingZones },
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('Get shipping zones tool failed', { requestId: context.requestId }, error as Error);
      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'GET_SHIPPING_ZONES_ERROR',
          message: (errorObj.message as string) || 'Failed to get shipping zones',
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