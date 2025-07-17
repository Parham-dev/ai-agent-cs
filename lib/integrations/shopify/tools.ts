import { tool } from '@openai/agents';
import { z } from 'zod';
import { ShopifyClient } from './client';
import { ShopifyCredentials, ProductSummary, ProductListItem, ShopifyVariant, ShopifyImage, ShopifyOption } from './types';
import { createIntegrationLogger } from '@/lib/utils/logger';

/**
 * Creates Shopify tools for an agent with the given credentials
 * @param credentials - Shopify store credentials
 * @returns Array of configured Shopify tools
 */
export function createShopifyTools(credentials: ShopifyCredentials) {
  const logger = createIntegrationLogger('shopify', {
    storeName: credentials.storeName
  });
  
  logger.debug('Creating Shopify tools', { 
    storeName: credentials.storeName, 
    hasAccessToken: !!credentials.accessToken 
  });
  
  const client = new ShopifyClient(credentials);

  const searchProducts = tool({
    name: 'searchProducts',
    description: 'Search for products in the Shopify store by title, vendor, product type, or tags',
    parameters: z.object({
      query: z.string().describe('Search term to find products (can be product name, vendor, type, or tag)'),
      limit: z.number().describe('Maximum number of products to return (between 1 and 50)'),
    }),
    async execute({ query, limit = 10 }) {
      try {
        const products = await client.searchProducts(query, limit);
        
        if (products.length === 0) {
          return `No products found matching "${query}". Try searching with different terms like product names, brands, or categories.`;
        }

        return `Found ${products.length} products matching "${query}":\n\n` +
          products.map((product: ProductSummary) => 
            `• **${product.title}** (ID: ${product.id})\n` +
            `  - Vendor: ${product.vendor}\n` +
            `  - Type: ${product.productType}\n` +
            `  - Price: $${product.priceRange.min}${product.priceRange.min !== product.priceRange.max ? ` - $${product.priceRange.max}` : ''}\n` +
            `  - Inventory: ${product.totalInventory} units\n` +
            `  - Status: ${product.status}\n` +
            `  - Variants: ${product.variantCount}`
          ).join('\n\n');

      } catch (error) {
        logger.error('Failed to search products', { query, limit }, error as Error);
        return 'Error: Failed to search products. Please try again.';
      }
    }
  });

  const getProductDetails = tool({
    name: 'getProductDetails',
    description: 'Get detailed information about a specific Shopify product by ID',
    parameters: z.object({
      productId: z.string().describe('The product ID to get details for'),
    }),
    async execute({ productId }) {
      try {
        const product = await client.getProductDetails(productId);
        
        if (!product) {
          return `No product found with ID: ${productId}`;
        }

        return `## Product Details: ${product.title}\n\n` +
          `**Basic Information:**\n` +
          `- ID: ${product.id}\n` +
          `- Vendor: ${product.vendor}\n` +
          `- Type: ${product.product_type}\n` +
          `- Status: ${product.status}\n` +
          `- Handle: ${product.handle}\n` +
          `- Tags: ${product.tags}\n\n` +
          
          `**Description:**\n${product.body_html ? product.body_html.replace(/<[^>]*>/g, '') : 'No description available'}\n\n` +
          
          `**Variants (${product.variants.length}):**\n` +
          product.variants.map((variant: ShopifyVariant) => 
            `• ${variant.title}\n` +
            `  - Price: $${variant.price}${variant.compare_at_price ? ` (Compare at: $${variant.compare_at_price})` : ''}\n` +
            `  - SKU: ${variant.sku || 'N/A'}\n` +
            `  - Inventory: ${variant.inventory_quantity || 0} units\n` +
            `  - Weight: ${variant.weight || 0} ${variant.weight_unit}`
          ).join('\n') + '\n\n' +
          
          `**Images (${product.images.length}):**\n` +
          product.images.map((image: ShopifyImage) => `• ${image.src}`).join('\n') + '\n\n' +
          
          `**Options:**\n` +
          product.options.map((option: ShopifyOption) => `• ${option.name}: ${option.values.join(', ')}`).join('\n');

      } catch (error) {
        logger.error('Failed to get product details', { productId }, error as Error);
        return 'Error: Failed to get product details. Please try again.';
      }
    }
  });

  const listProducts = tool({
    name: 'listProducts',
    description: 'List all products in the Shopify store with basic information',
    parameters: z.object({
      limit: z.number().describe('Maximum number of products to return (between 1 and 250)'),
      status: z.enum(['active', 'archived', 'draft', 'all']).describe('Filter products by status'),
    }),
    async execute({ limit = 20, status }) {
      try {
        const products = await client.listProducts(limit, status);
        
        if (products.length === 0) {
          return 'No products found in your store.';
        }

        return `## Your Product Catalog (${products.length} products)\n\n` +
          products.map((product: ProductListItem) => 
            `**${product.title}** (ID: ${product.id})\n` +
            `• Vendor: ${product.vendor}\n` +
            `• Type: ${product.productType}\n` +
            `• Price: $${product.priceRange.min}${product.priceRange.min !== product.priceRange.max ? ` - $${product.priceRange.max}` : ''}\n` +
            `• Inventory: ${product.totalInventory} units\n` +
            `• Status: ${product.status}`
          ).join('\n\n');

      } catch (error) {
        logger.error('Failed to list products', { limit, status }, error as Error);
        return 'Error: Failed to list products. Please try again.';
      }
    }
  });

  return [searchProducts, getProductDetails, listProducts];
}

/**
 * Get Shopify integration capabilities
 * @returns Array of capability descriptions
 */
export function getShopifyCapabilities() {
  return [
    {
      id: 'product-search',
      name: 'Product Search',
      description: 'Search products by name, vendor, type, or tags'
    },
    {
      id: 'product-details',
      name: 'Product Details',
      description: 'Get detailed information about specific products'
    },
    {
      id: 'product-catalog',
      name: 'Product Catalog',
      description: 'Browse and list all products in the store'
    }
  ];
} 