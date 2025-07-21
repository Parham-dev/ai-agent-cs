import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  MCPToolContext, 
  MCPToolResponse
} from '../types';
import { DeliveryProfile } from '../client/commerce/get-shipping-zones';

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
  ): Promise<MCPToolResponse<{ deliveryProfiles: DeliveryProfile[] }>> {
    const startTime = Date.now();
    
    try {
      const client = new ShopifyMCPClient(context.credentials, context.settings);
      const deliveryProfiles = await client.getShippingZones();

      return {
        success: true,
        data: { deliveryProfiles },
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