import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  ListProductsParams, 
  ListProductsResponse, 
  MCPToolContext, 
  MCPToolResponse 
} from '../types';

/**
 * List Products Tool
 * List products with optional filtering by status
 */
export const listProductsTool = {
  name: 'listProducts',
  description: 'List products with optional filtering by status',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of products to return (1-250)',
        minimum: 1,
        maximum: 250,
        default: 50
      },
      status: {
        type: 'string',
        description: 'Filter products by status',
        enum: ['active', 'archived', 'draft']
      }
    },
    required: []
  },

  async handler(
    params: ListProductsParams,
    context: MCPToolContext
  ): Promise<MCPToolResponse<ListProductsResponse>> {
    const startTime = Date.now();
    
    try {
      logger.debug('List products tool called', { 
        requestId: context.requestId,
        limit: params.limit,
        status: params.status 
      });

      // Validate parameters
      const validationError = validateListProductsParams(params);
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

      // List products
      const response = await client.listProducts(params.limit || 50, params.status);

      // Format response
      const formattedResponse: ListProductsResponse = {
        products: response.map((product: unknown) => formatProductListing(product as Record<string, unknown>)),
        totalCount: response.length,
        hasNextPage: false, // Simplified for now
        hasPreviousPage: false // Simplified for now
      };

      logger.info('List products completed successfully', {
        requestId: context.requestId,
        limit: params.limit,
        status: params.status,
        resultCount: response.length,
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
      logger.error('List products tool failed', {
        requestId: context.requestId,
        limit: params.limit,
        status: params.status
      }, error as Error);

      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'LIST_PRODUCTS_ERROR',
          message: (errorObj.message as string) || 'Failed to list products',
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
 * Validate list products parameters
 */
function validateListProductsParams(params: ListProductsParams): string | null {
  if (params.limit !== undefined) {
    if (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 250) {
      return 'Limit must be a number between 1 and 250';
    }
  }

  if (params.status !== undefined) {
    if (typeof params.status !== 'string') {
      return 'Status must be a string';
    }

    const validStatuses = ['active', 'archived', 'draft'];
    if (!validStatuses.includes(params.status)) {
      return `Status must be one of: ${validStatuses.join(', ')}`;
    }
  }

  return null;
}

/**
 * Format product for listing
 */
function formatProductListing(product: Record<string, unknown>) {
  const variants = (product.variants as Array<Record<string, unknown>>) || [];
  const images = (product.images as Array<Record<string, unknown>>) || [];
  const tags = product.tags as string;
  
  // Calculate inventory totals
  const totalInventory = variants.reduce((total: number, variant: Record<string, unknown>) => {
    return total + ((variant.inventory_quantity as number) || 0);
  }, 0);

  // Calculate price range
  const prices = variants.map((variant: Record<string, unknown>) => parseFloat((variant.price as string) || '0'));
  const minPrice = Math.min(...prices).toFixed(2);
  const maxPrice = Math.max(...prices).toFixed(2);

  return {
    id: String(product.id || ''),
    title: String(product.title || ''),
    handle: String(product.handle || ''),
    vendor: String(product.vendor || ''),
    productType: String(product.product_type || ''),
    tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
    status: String(product.status || ''),
    createdAt: String(product.created_at || ''),
    updatedAt: String(product.updated_at || ''),
    variantCount: variants.length,
    imageCount: images.length,
    totalInventory,
    minPrice: minPrice,
    maxPrice: maxPrice
  };
}