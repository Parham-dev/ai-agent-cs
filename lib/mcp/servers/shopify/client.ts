import { ShopifyClient as BaseShopifyClient } from '@/lib/integrations/shopify/client';
import { logger } from '@/lib/utils/logger';
import { MCPServerCredentials, MCPServerError } from './types';

/**
 * Shopify API client wrapper for MCP server
 */
export class ShopifyMCPClient {
  private client: BaseShopifyClient;
  private credentials: MCPServerCredentials['credentials'];
  private settings: MCPServerCredentials['settings'];

  constructor(credentials: MCPServerCredentials['credentials'], settings?: MCPServerCredentials['settings']) {
    this.credentials = credentials;
    this.settings = settings || {};
    
    // Initialize the base Shopify client
    this.client = new BaseShopifyClient({
      storeName: credentials.shopDomain as string,
      accessToken: credentials.accessToken as string
    });
  }

  /**
   * Search products by query
   */
  async searchProducts(query: string, limit: number = 10): Promise<{ products: unknown[] }> {
    try {
      logger.debug('Searching products', { query, limit });
      
      const response = await this.client.searchProducts(query, limit);
      
      logger.debug('Product search completed', { 
        query, 
        resultCount: (response as unknown as { products: unknown[] }).products?.length || 0 
      });
      
      return { products: response } as { products: unknown[] };
      
    } catch (error) {
      logger.error('Product search failed', { query, limit }, error as Error);
      throw this.handleError(error, 'searchProducts');
    }
  }

  /**
   * Get product details by ID
   */
  async getProductDetails(productId: string): Promise<{ product: unknown }> {
    try {
      logger.debug('Getting product details', { productId });
      
      const response = await this.client.getProductDetails(productId);
      
      logger.debug('Product details retrieved', { 
        productId, 
        title: (response as { title: string })?.title 
      });
      
      return { product: response } as { product: unknown };
      
    } catch (error) {
      logger.error('Get product details failed', { productId }, error as Error);
      throw this.handleError(error, 'getProductDetails');
    }
  }

  /**
   * List products with optional filtering
   */
  async listProducts(limit: number = 50, status?: string): Promise<{ products: unknown[] }> {
    try {
      logger.debug('Listing products', { limit, status });
      
      const response = await this.client.listProducts(limit, status as "active" | "archived" | "draft" | "all" | undefined);
      
      logger.debug('Product listing completed', { 
        limit, 
        status,
        resultCount: (response as unknown as { products: unknown[] }).products?.length || 0 
      });
      
      return { products: response } as { products: unknown[] };
      
    } catch (error) {
      logger.error('List products failed', { limit, status }, error as Error);
      throw this.handleError(error, 'listProducts');
    }
  }

  /**
   * Validate credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      logger.debug('Validating Shopify credentials');
      
      // Test with a simple API call - use list products as shop endpoint may not exist
      const response = await this.client.listProducts(1);
      
      logger.info('Shopify credentials validated', { 
        shopDomain: this.credentials.shopDomain,
        productCount: response?.length || 0
      });
      
      return true;
      
    } catch (error) {
      logger.error('Shopify credentials validation failed', {}, error as Error);
      return false;
    }
  }

  /**
   * Handle API errors and convert to MCP server errors
   */
  private handleError(error: unknown, operation: string): MCPServerError {
    const errorObj = error as Record<string, unknown>;
    
    if (errorObj.response) {
      // HTTP error response
      const response = errorObj.response as { status: number; data: unknown };
      const status = response.status;
      const data = response.data;
      
      if (status === 401 || status === 403) {
        return {
          type: 'authentication',
          code: 'SHOPIFY_AUTH_ERROR',
          message: 'Shopify authentication failed. Please check your credentials.',
          originalError: error,
          context: { operation, status, data }
        };
      }
      
      if (status === 429) {
        return {
          type: 'api',
          code: 'SHOPIFY_RATE_LIMIT',
          message: 'Shopify API rate limit exceeded. Please try again later.',
          originalError: error,
          context: { operation, status, data }
        };
      }
      
      if (status >= 500) {
        return {
          type: 'api',
          code: 'SHOPIFY_SERVER_ERROR',
          message: 'Shopify server error. Please try again later.',
          originalError: error,
          context: { operation, status, data }
        };
      }
      
      if (status >= 400) {
        const dataObj = data as Record<string, unknown>;
        const errors = dataObj?.errors as Array<{ message: string }>;
        return {
          type: 'validation',
          code: 'SHOPIFY_CLIENT_ERROR',
          message: errors?.[0]?.message || 'Invalid request to Shopify API.',
          originalError: error,
          context: { operation, status, data }
        };
      }
    }
    
    if (errorObj.code === 'ECONNREFUSED' || errorObj.code === 'ENOTFOUND') {
      return {
        type: 'network',
        code: 'SHOPIFY_NETWORK_ERROR',
        message: 'Unable to connect to Shopify. Please check your internet connection.',
        originalError: error,
        context: { operation }
      };
    }
    
    if (errorObj.code === 'ECONNRESET' || errorObj.code === 'ETIMEDOUT') {
      return {
        type: 'network',
        code: 'SHOPIFY_TIMEOUT',
        message: 'Request to Shopify timed out. Please try again.',
        originalError: error,
        context: { operation }
      };
    }
    
    // Generic server error
    return {
      type: 'server',
      code: 'SHOPIFY_UNKNOWN_ERROR',
      message: (error as Error).message || 'An unknown error occurred while communicating with Shopify.',
      originalError: error,
      context: { operation }
    };
  }

  /**
   * Get client statistics
   */
  getStats(): {
    shopDomain: string;
    apiVersion: string;
    connected: boolean;
    lastActivity?: Date;
  } {
    return {
      shopDomain: this.credentials.shopDomain,
      apiVersion: this.credentials.apiVersion || '2023-10',
      connected: true, // Simplified for now
      lastActivity: new Date()
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.listProducts(1);
      return true;
    } catch (error) {
      logger.error('Shopify health check failed', {}, error as Error);
      return false;
    }
  }
}