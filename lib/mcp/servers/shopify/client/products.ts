import { BaseShopifyClient } from './base';
import { ShopifyProduct } from '../types';

/**
 * Product-related Shopify API methods
 */
export class ProductsService extends BaseShopifyClient {
  /**
   * Search products by query
   */
  async searchProducts(query: string, limit: number = 10): Promise<ShopifyProduct[]> {
    const searchLimit = Math.min(limit, 50);
    const endpoint = `/products.json?title=${encodeURIComponent(query)}&limit=${searchLimit}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to search products. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.products || [];
  }

  /**
   * Get product details by ID
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
   * List products with optional filtering
   */
  async listProducts(limit: number = 50, status?: string): Promise<ShopifyProduct[]> {
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
    return data.products || [];
  }
}