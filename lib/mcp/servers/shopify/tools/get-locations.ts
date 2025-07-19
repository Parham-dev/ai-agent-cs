import { createShopifyTool } from './base-tool-factory';

/**
 * Get Locations Tool - Simplified with base factory
 */
export const getLocationsTool = createShopifyTool({
  name: 'getLocations',
  description: 'Get all store locations with address and contact information',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (client) => {
    const locations = await client.getLocations();
    return { locations };
  }
});