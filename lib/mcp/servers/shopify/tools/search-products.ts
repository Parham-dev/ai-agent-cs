import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client/index';
import { 
  SearchProductsParams, 
  SearchProductsResponse, 
  MCPToolContext, 
  MCPToolResponse 
} from '../types';

/**
 * Search Products Tool
 * Searches for products by title, vendor, type, or tags
 */
export const searchProductsTool = {
  name: 'searchProducts',
  description: 'Search for products by title, vendor, type, or tags',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for product title, vendor, type, or tags'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of products to return (1-50)',
        minimum: 1,
        maximum: 50,
        default: 10
      }
    },
    required: ['query']
  },

  async handler(
    params: SearchProductsParams,
    context: MCPToolContext
  ): Promise<MCPToolResponse<SearchProductsResponse>> {
    const startTime = Date.now();
    
    try {
      logger.debug('Search products tool called', { 
        requestId: context.requestId,
        query: params.query,
        limit: params.limit 
      });

      // Validate parameters
      const validationError = validateSearchParams(params);
      if (validationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationError
          },
          metadata: {
            requestId: context.requestId,
            timestamp: context.timestamp,
            executionTime: Date.now() - startTime
          }
        };
      }

      // Initialize Shopify client
      const client = new ShopifyMCPClient(context.credentials, context.settings);

      // Search products
      const response = await client.searchProducts(params.query, params.limit || 10);

      // Format response
      const formattedResponse: SearchProductsResponse = {
        products: response.map((product: unknown) => formatProductSummary(product as Record<string, unknown>)),
        totalCount: response.length
      };

      logger.info('Search products completed successfully', {
        requestId: context.requestId,
        query: params.query,
        resultCount: formattedResponse.products.length,
        executionTime: Date.now() - startTime
      });

      return {
        success: true,
        data: formattedResponse,
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('Search products tool failed', {
        requestId: context.requestId,
        query: params.query,
        limit: params.limit
      }, error as Error);

      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'SEARCH_PRODUCTS_ERROR',
          message: (errorObj.message as string) || 'Failed to search products',
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

/**
 * Validate search parameters
 */
function validateSearchParams(params: SearchProductsParams): string | null {
  if (!params.query || typeof params.query !== 'string') {
    return 'Query is required and must be a string';
  }

  if (params.query.trim().length === 0) {
    return 'Query cannot be empty';
  }

  if (params.query.length > 100) {
    return 'Query cannot exceed 100 characters';
  }

  if (params.limit !== undefined) {
    if (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 50) {
      return 'Limit must be a number between 1 and 50';
    }
  }

  return null;
}

/**
 * Format product for search results
 */
function formatProductSummary(product: Record<string, unknown>) {
  const tags = product.tags as string;
  const variants = product.variants as Array<Record<string, unknown>>;
  const images = product.images as Array<Record<string, unknown>>;
  
  return {
    id: String(product.id || ''),
    title: String(product.title || ''),
    handle: String(product.handle || ''),
    vendor: String(product.vendor || ''),
    productType: String(product.product_type || ''),
    tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
    status: String(product.status || ''),
    variants: variants?.map((variant: Record<string, unknown>) => ({
      id: String(variant.id || ''),
      price: String(variant.price || ''),
      availableForSale: (variant.inventory_quantity as number) > 0,
      inventoryQuantity: Number(variant.inventory_quantity || 0)
    })) || [],
    images: images?.map((image: Record<string, unknown>) => ({
      id: String(image.id || ''),
      src: String(image.src || ''),
      altText: String(image.alt || '')
    })) || []
  };
}