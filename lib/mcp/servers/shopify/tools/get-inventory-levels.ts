import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  MCPToolContext, 
  MCPToolResponse,
  ShopifyInventoryLevel
} from '../types';

interface GetInventoryLevelsParams {
  locationId?: number;
  limit?: number;
}

/**
 * Get Inventory Levels Tool
 * Gets inventory levels for products at specific locations
 */
export const getInventoryLevelsTool = {
  name: 'getInventoryLevels',
  description: 'Get inventory levels for products at specific locations',
  inputSchema: {
    type: 'object',
    properties: {
      locationId: {
        type: 'number',
        description: 'Filter by specific location ID'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of inventory items to return (1-250)',
        minimum: 1,
        maximum: 250,
        default: 50
      }
    },
    required: []
  },

  async handler(
    params: GetInventoryLevelsParams,
    context: MCPToolContext
  ): Promise<MCPToolResponse<{ inventoryLevels: ShopifyInventoryLevel[] }>> {
    const startTime = Date.now();
    
    try {
      logger.debug('Get inventory levels tool called', { 
        requestId: context.requestId,
        locationId: params.locationId,
        limit: params.limit
      });

      // Initialize Shopify client
      const client = new ShopifyMCPClient(context.credentials, context.settings);

      // Get inventory levels
      const inventoryLevels = await client.getInventoryLevels(params.locationId, params.limit || 50);

      logger.info('Get inventory levels completed successfully', {
        requestId: context.requestId,
        locationId: params.locationId,
        inventoryCount: inventoryLevels.length,
        executionTime: Date.now() - startTime
      });

      return {
        success: true,
        data: { inventoryLevels },
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('Get inventory levels tool failed', {
        requestId: context.requestId,
        locationId: params.locationId,
        limit: params.limit
      }, error as Error);

      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'GET_INVENTORY_LEVELS_ERROR',
          message: (errorObj.message as string) || 'Failed to get inventory levels',
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