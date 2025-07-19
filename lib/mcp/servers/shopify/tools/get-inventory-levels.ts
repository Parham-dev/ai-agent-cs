import { createShopifyTool, validators } from './base-tool-factory';
import { ShopifyInventoryLevel } from '../types';

interface GetInventoryLevelsParams {
  locationId?: number;
  limit?: number;
}

/**
 * Get Inventory Levels Tool - Simplified with base factory
 */
export const getInventoryLevelsTool = createShopifyTool<
  GetInventoryLevelsParams,
  { inventoryLevels: ShopifyInventoryLevel[] }
>({
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
  validateParams: (params) => validators.limit(params.limit),
  handler: async (client, params) => {
    const inventoryLevels = await client.getInventoryLevels(params.locationId, params.limit || 50);
    return { inventoryLevels };
  }
});