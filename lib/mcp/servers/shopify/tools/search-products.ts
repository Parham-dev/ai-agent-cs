import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client/index';
import { 
  SearchProductsParams, 
  SearchProductsResponse, 
  MCPToolContext, 
  MCPToolResponse,
  ShopifyProduct
} from '../types';

/**
 * Search Products Tool
 * Searches for products by title, vendor, type, or tags
 */
export const searchProductsTool = {
  name: 'searchProducts',
  description: 'Search for products with advanced filtering options for customer service',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for product title'
      },
      vendor: {
        type: 'string',
        description: 'Filter by brand/vendor name'
      },
      productType: {
        type: 'string',
        description: 'Filter by product category/type'
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by product tags (e.g., waterproof, sale, new)'
      },
      priceMin: {
        type: 'number',
        description: 'Minimum price filter'
      },
      priceMax: {
        type: 'number',
        description: 'Maximum price filter'
      },
      inStockOnly: {
        type: 'boolean',
        description: 'Show only products that are in stock',
        default: true
      },
      onSaleOnly: {
        type: 'boolean',
        description: 'Show only products that are on sale'
      },
      sku: {
        type: 'string',
        description: 'Search by specific SKU code'
      },
      barcode: {
        type: 'string',
        description: 'Search by barcode'
      },
      collectionId: {
        type: 'string',
        description: 'Filter by specific collection ID'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of products to return (1-50)',
        minimum: 1,
        maximum: 50,
        default: 5
      }
    },
    required: []
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
      const response = await client.searchProducts(params);

      // Format response - customer-focused data only
      const formattedResponse: SearchProductsResponse = {
        products: response.map((product) => formatCustomerProductSummary(product)),
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
  // At least one search criterion is required
  if (!params.query && !params.vendor && !params.productType && 
      !params.tags?.length && !params.sku && !params.barcode && 
      !params.collectionId) {
    return 'At least one search parameter is required (query, vendor, productType, tags, sku, barcode, or collectionId)';
  }

  if (params.query && params.query.length > 100) {
    return 'Query cannot exceed 100 characters';
  }

  if (params.limit !== undefined) {
    if (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 50) {
      return 'Limit must be a number between 1 and 50';
    }
  }

  if (params.priceMin !== undefined && params.priceMin < 0) {
    return 'Minimum price cannot be negative';
  }

  if (params.priceMax !== undefined && params.priceMax < 0) {
    return 'Maximum price cannot be negative';
  }

  if (params.priceMin !== undefined && params.priceMax !== undefined && params.priceMin > params.priceMax) {
    return 'Minimum price cannot be greater than maximum price';
  }

  return null;
}

/**
 * Format product for customer-facing display (hide internal status/admin data)
 */
function formatCustomerProductSummary(product: ShopifyProduct) {
  return {
    id: String(product.id || ''),
    title: String(product.title || ''),
    handle: String(product.handle || ''),
    vendor: String(product.vendor || ''),
    productType: String(product.product_type || ''),
    description: String(product.body_html || '').replace(/<[^>]*>/g, ''), // Strip HTML tags
    tags: product.tags ? (typeof product.tags === 'string' ? product.tags.split(',').map((tag: string) => tag.trim()) : product.tags) : [],
    collections: product.collections || [],
    variants: product.variants?.map((variant) => ({
      id: String(variant.id || ''),
      title: String(variant.title || ''),
      price: String(variant.price || ''),
      compareAtPrice: variant.compareAtPrice ? String(variant.compareAtPrice) : undefined,
      sku: String(variant.sku || ''),
      barcode: variant.barcode ? String(variant.barcode) : undefined,
      availableForSale: Boolean(variant.availableForSale),
      inventoryQuantity: Number(variant.inventoryQuantity || 0),
      weight: Number(variant.weight || 0),
      weightUnit: String(variant.weightUnit || variant.weight_unit || 'kg'),
      onSale: Boolean(variant.onSale),
      salePercentage: variant.salePercentage ? Number(variant.salePercentage) : undefined
    })) || [],
    images: product.images?.map((image) => ({
      id: String(image.id || ''),
      src: String(image.src || image.url || ''),
      altText: image.altText ? String(image.altText) : undefined
    })) || [],
    priceRange: product.priceRange || { min: '0', max: '0' },
    onSale: Boolean(product.onSale),
    totalInventory: Number(product.totalInventory || 0),
    onlineStoreUrl: product.onlineStoreUrl ? String(product.onlineStoreUrl) : undefined
  };
}