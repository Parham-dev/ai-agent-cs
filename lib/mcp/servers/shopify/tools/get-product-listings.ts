import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  MCPToolContext, 
  MCPToolResponse,
  ShopifyProductListing
} from '../types';

interface GetProductListingsParams {
  limit?: number;
}

export const getProductListingsTool = {
  name: 'getProductListings',
  description: 'Get product listings for online store (published products)',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of listings to return (1-250)',
        minimum: 1,
        maximum: 250,
        default: 50
      }
    },
    required: []
  },

  async handler(
    params: GetProductListingsParams,
    context: MCPToolContext
  ): Promise<MCPToolResponse<{ productListings: ShopifyProductListing[] }>> {
    const startTime = Date.now();
    
    try {
      const client = new ShopifyMCPClient(context.credentials, context.settings);
      const productListings = await client.getProductListings(params.limit || 50);

      return {
        success: true,
        data: { productListings },
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('Get product listings tool failed', { requestId: context.requestId }, error as Error);
      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'GET_PRODUCT_LISTINGS_ERROR',
          message: (errorObj.message as string) || 'Failed to get product listings',
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