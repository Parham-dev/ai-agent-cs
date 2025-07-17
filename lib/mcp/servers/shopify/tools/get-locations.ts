import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  MCPToolContext, 
  MCPToolResponse,
  ShopifyLocation
} from '../types';

/**
 * Get Locations Tool
 * Gets all store locations with address and contact information
 */
export const getLocationsTool = {
  name: 'getLocations',
  description: 'Get all store locations with address and contact information',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },

  async handler(
    params: Record<string, unknown>,
    context: MCPToolContext
  ): Promise<MCPToolResponse<{ locations: ShopifyLocation[] }>> {
    const startTime = Date.now();
    
    try {
      logger.debug('Get locations tool called', { 
        requestId: context.requestId
      });

      // Initialize Shopify client
      const client = new ShopifyMCPClient(context.credentials, context.settings);

      // Get locations
      const locations = await client.getLocations();

      logger.info('Get locations completed successfully', {
        requestId: context.requestId,
        locationCount: locations.length,
        executionTime: Date.now() - startTime
      });

      return {
        success: true,
        data: { locations },
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('Get locations tool failed', {
        requestId: context.requestId
      }, error as Error);

      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'GET_LOCATIONS_ERROR',
          message: (errorObj.message as string) || 'Failed to get locations',
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