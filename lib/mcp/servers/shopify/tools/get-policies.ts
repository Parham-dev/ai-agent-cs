import { createShopifyTool } from './base-tool-factory';
import { ShopifyPolicy } from '../types';

/**
 * Get Policies Tool - Simplified with base factory
 */
export const getPoliciesTool = createShopifyTool({
  name: 'getPolicies',
  description: 'Get store legal policies (privacy, terms of service, refund, etc.)',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },
  handler: async (client) => {
    const policies = await client.getPolicies();
    return { policies };
  }
});