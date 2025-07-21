import { createShopifyTool, validators } from './base-tool-factory';
import { ListProductsParams, ListProductsResponse } from '../types';

/**
 * List Products Tool - Simplified with base factory
 */
export const listProductsTool = createShopifyTool<ListProductsParams, ListProductsResponse>({
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
  validateParams: (params) => {
    return validators.limit(params.limit) || validators.status(params.status);
  },
  handler: async (client, params) => {
    const response = await client.listProducts({ limit: params.limit || 50, status: params.status });
    return {
      products: response.map((product: unknown) => formatProductListing(product as Record<string, unknown>)),
      totalCount: response.length,
      hasNextPage: false, // Simplified for now
      hasPreviousPage: false // Simplified for now
    };
  }
});

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