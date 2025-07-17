import { 
  ShopifyCredentials, 
  ShopifyProduct, 
  ProductSummary, 
  ProductListItem,
  ShopifyVariant 
} from './types';
import { cleanStoreName } from './validator';

/**
 * Shopify API client for making authenticated requests to Shopify Admin API
 */
export class ShopifyClient {
  private credentials: ShopifyCredentials;
  private baseUrl: string;

  constructor(credentials: ShopifyCredentials) {
    this.credentials = credentials;
    this.baseUrl = `https://${cleanStoreName(credentials.shopUrl)}.myshopify.com/admin/api/2024-01`;
  }

  /**
   * Make authenticated request to Shopify API
   */
  private async makeRequest(endpoint: string): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': this.credentials.accessToken,
        'Content-Type': 'application/json',
      },
    });

    return response;
  }

  /**
   * Search products by title/query
   * @param query - Search term
   * @param limit - Maximum number of results (1-50)
   * @returns Array of product summaries
   */
  async searchProducts(query: string, limit: number = 10): Promise<ProductSummary[]> {
    const searchLimit = Math.min(limit, 50);
    const endpoint = `/products.json?title=${encodeURIComponent(query)}&limit=${searchLimit}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to search products. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      return [];
    }

    return data.products.map((product: ShopifyProduct) => ({
      id: product.id,
      title: product.title,
      vendor: product.vendor,
      productType: product.product_type,
      status: product.status,
      tags: product.tags,
      priceRange: {
        min: Math.min(...product.variants.map((v: ShopifyVariant) => parseFloat(v.price))),
        max: Math.max(...product.variants.map((v: ShopifyVariant) => parseFloat(v.price)))
      },
      totalInventory: product.variants.reduce((sum: number, variant: ShopifyVariant) => sum + (variant.inventory_quantity || 0), 0),
      handle: product.handle,
      variantCount: product.variants.length
    }));
  }

  /**
   * Get detailed product information by ID
   * @param productId - Product ID to fetch
   * @returns Full product details
   */
  async getProductDetails(productId: string): Promise<ShopifyProduct | null> {
    const endpoint = `/products/${productId}.json`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product details. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.product || null;
  }

  /**
   * List products with optional status filter
   * @param limit - Maximum number of results (1-250)
   * @param status - Product status filter
   * @returns Array of product list items
   */
  async listProducts(
    limit: number = 20, 
    status?: 'active' | 'archived' | 'draft' | 'all'
  ): Promise<ProductListItem[]> {
    const productLimit = Math.min(limit, 250);
    let endpoint = `/products.json?limit=${productLimit}`;
    
    if (status && status !== 'all') {
      endpoint += `&status=${status}`;
    }
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.products || data.products.length === 0) {
      return [];
    }

    return data.products.map((product: ShopifyProduct) => ({
      id: product.id,
      title: product.title,
      vendor: product.vendor,
      productType: product.product_type,
      status: product.status,
      priceRange: {
        min: Math.min(...product.variants.map((v: ShopifyVariant) => parseFloat(v.price))),
        max: Math.max(...product.variants.map((v: ShopifyVariant) => parseFloat(v.price)))
      },
      totalInventory: product.variants.reduce((sum: number, variant: ShopifyVariant) => sum + (variant.inventory_quantity || 0), 0),
      handle: product.handle
    }));
  }
} 