import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  GetProductDetailsParams, 
  GetProductDetailsResponse, 
  MCPToolContext, 
  MCPToolResponse 
} from '../types';

/**
 * Get Product Details Tool
 * Retrieves detailed information for a specific product by ID
 */
export const getProductDetailsTool = {
  name: 'getProductDetails',
  description: 'Get detailed information for a specific product by ID',
  inputSchema: {
    type: 'object',
    properties: {
      productId: {
        type: 'string',
        description: 'The unique Shopify product ID'
      }
    },
    required: ['productId']
  },

  async handler(
    params: GetProductDetailsParams,
    context: MCPToolContext
  ): Promise<MCPToolResponse<GetProductDetailsResponse>> {
    const startTime = Date.now();
    
    try {
      logger.debug('Get product details tool called', { 
        requestId: context.requestId,
        productId: params.productId 
      });

      // Validate parameters
      const validationError = validateProductDetailsParams(params);
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

      // Get product details
      const response = await client.getProductDetails(params.productId);

      if (!response) {
        return {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: `Product with ID ${params.productId} not found`
          },
          metadata: {
            requestId: context.requestId,
            timestamp: context.timestamp,
            executionTime: Date.now() - startTime
          }
        };
      }

      // Format response
      const formattedResponse: GetProductDetailsResponse = {
        product: formatProductDetails(response as unknown as Record<string, unknown>)
      };

      logger.info('Get product details completed successfully', {
        requestId: context.requestId,
        productId: params.productId,
        productTitle: response.title,
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
      logger.error('Get product details tool failed', {
        requestId: context.requestId,
        productId: params.productId
      }, error as Error);

      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'GET_PRODUCT_DETAILS_ERROR',
          message: (errorObj.message as string) || 'Failed to get product details',
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
 * Validate product details parameters
 */
function validateProductDetailsParams(params: GetProductDetailsParams): string | null {
  if (!params.productId || typeof params.productId !== 'string') {
    return 'Product ID is required and must be a string';
  }

  if (params.productId.trim().length === 0) {
    return 'Product ID cannot be empty';
  }

  // Basic validation for Shopify product ID format
  if (!/^\d+$/.test(params.productId)) {
    return 'Product ID must be a valid Shopify product ID (numeric)';
  }

  return null;
}

/**
 * Format product details for response
 */
function formatProductDetails(product: Record<string, unknown>) {
  const tags = product.tags as string;
  const variants = product.variants as Array<Record<string, unknown>>;
  const images = product.images as Array<Record<string, unknown>>;
  const options = product.options as Array<Record<string, unknown>>;
  
  return {
    id: String(product.id || ''),
    title: String(product.title || ''),
    handle: String(product.handle || ''),
    description: String(product.body_html || ''),
    vendor: String(product.vendor || ''),
    productType: String(product.product_type || ''),
    tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
    status: String(product.status || ''),
    createdAt: String(product.created_at || ''),
    updatedAt: String(product.updated_at || ''),
    variants: variants?.map((variant: Record<string, unknown>) => ({
      id: String(variant.id || ''),
      title: String(variant.title || ''),
      price: String(variant.price || ''),
      compareAtPrice: String(variant.compare_at_price || ''),
      sku: String(variant.sku || ''),
      barcode: String(variant.barcode || ''),
      availableForSale: (variant.inventory_quantity as number) > 0,
      inventoryQuantity: Number(variant.inventory_quantity || 0),
      weight: Number(variant.weight || 0),
      weightUnit: String(variant.weight_unit || 'kg'),
      requiresShipping: Boolean(variant.requires_shipping),
      taxable: Boolean(variant.taxable),
      inventoryPolicy: String(variant.inventory_policy || ''),
      fulfillmentService: String(variant.fulfillment_service || ''),
      inventoryManagement: String(variant.inventory_management || ''),
      position: Number(variant.position || 0),
      createdAt: String(variant.created_at || ''),
      updatedAt: String(variant.updated_at || '')
    })) || [],
    images: images?.map((image: Record<string, unknown>) => ({
      id: String(image.id || ''),
      src: String(image.src || ''),
      altText: String(image.alt || ''),
      width: Number(image.width || 0),
      height: Number(image.height || 0),
      position: Number(image.position || 0),
      createdAt: String(image.created_at || ''),
      updatedAt: String(image.updated_at || '')
    })) || [],
    options: options?.map((option: Record<string, unknown>) => ({
      id: String(option.id || ''),
      name: String(option.name || ''),
      position: Number(option.position || 0),
      values: (option.values as string[]) || []
    })) || [],
    seo: {
      title: String(product.seo_title || ''),
      description: String(product.seo_description || '')
    }
  };
}