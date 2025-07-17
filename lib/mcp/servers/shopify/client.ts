import { logger } from '@/lib/utils/logger';
import { 
  MCPServerCredentials, 
  MCPServerError,
  ShopifyCredentials,
  ShopifyProduct,
  ShopifyLocation,
  ShopifyInventoryLevel,
  ShopifyInventoryItem,
  ShopifyPolicy,
  ShopifyMarketingEvent,
  ShopifyPage,
  ShopifyPaymentTerm,
  ShopifyProductListing,
  ShopifyShippingZone,
  ShopifyLocale,
  ShopifyVariant
} from './types';

/**
 * Shopify API client wrapper for MCP server
 */
function cleanStoreName(storeName: string): string {
  return storeName.replace(/^https?:\/\//, '').replace(/\.myshopify\.com$/, '').replace(/\/$/, '');
}

export class ShopifyMCPClient {
  private credentials: MCPServerCredentials['credentials'];
  private settings: MCPServerCredentials['settings'];
  private baseUrl: string;

  constructor(credentials: MCPServerCredentials['credentials'], settings?: MCPServerCredentials['settings']) {
    this.credentials = credentials;
    this.settings = settings || {};
    this.baseUrl = `https://${cleanStoreName(credentials.shopUrl as string)}.myshopify.com/admin/api/2024-01`;
  }

  /**
   * Make authenticated request to Shopify API
   */
  private async makeRequest(endpoint: string): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': this.credentials.accessToken as string,
        'Content-Type': 'application/json',
      },
    });

    return response;
  }

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

  /**
   * Get store locations
   */
  async getLocations(): Promise<ShopifyLocation[]> {
    const endpoint = `/locations.json`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch locations. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.locations || [];
  }

  /**
   * Get inventory levels for a location
   */
  async getInventoryLevels(locationId?: number, limit: number = 50): Promise<ShopifyInventoryLevel[]> {
    let endpoint = `/inventory_levels.json?limit=${Math.min(limit, 250)}`;
    
    if (locationId) {
      endpoint += `&location_ids=${locationId}`;
    }
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory levels. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.inventory_levels || [];
  }

  /**
   * Get inventory items
   */
  async getInventoryItems(limit: number = 50): Promise<ShopifyInventoryItem[]> {
    const endpoint = `/inventory_items.json?limit=${Math.min(limit, 250)}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory items. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.inventory_items || [];
  }

  /**
   * Get store policies (legal policies)
   */
  async getPolicies(): Promise<ShopifyPolicy[]> {
    const endpoint = `/policies.json`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch policies. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.policies || [];
  }

  /**
   * Get marketing events
   */
  async getMarketingEvents(limit: number = 50): Promise<ShopifyMarketingEvent[]> {
    const endpoint = `/marketing_events.json?limit=${Math.min(limit, 250)}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch marketing events. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.marketing_events || [];
  }

  /**
   * Get online store pages
   */
  async getPages(limit: number = 50): Promise<ShopifyPage[]> {
    const endpoint = `/pages.json?limit=${Math.min(limit, 250)}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch pages. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.pages || [];
  }

  /**
   * Get payment terms
   */
  async getPaymentTerms(limit: number = 50): Promise<ShopifyPaymentTerm[]> {
    const endpoint = `/payment_terms.json?limit=${Math.min(limit, 250)}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch payment terms. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.payment_terms || [];
  }

  /**
   * Get product listings (for online store)
   */
  async getProductListings(limit: number = 50): Promise<ShopifyProductListing[]> {
    const endpoint = `/product_listings.json?limit=${Math.min(limit, 250)}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product listings. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.product_listings || [];
  }

  /**
   * Get shipping zones
   */
  async getShippingZones(): Promise<ShopifyShippingZone[]> {
    const endpoint = `/shipping_zones.json`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch shipping zones. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.shipping_zones || [];
  }

  /**
   * Get available locales
   */
  async getLocales(): Promise<ShopifyLocale[]> {
    const endpoint = `/locales.json`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch locales. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.locales || [];
  }

  /**
   * Validate credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      logger.debug('Validating Shopify credentials');
      
      // Test with a simple API call - use list products as shop endpoint may not exist
      const response = await this.listProducts(1);
      
      logger.info('Shopify credentials validated', { 
        shopDomain: this.credentials.shopUrl,
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
    shopUrl: string;
    apiVersion: string;
    connected: boolean;
    lastActivity?: Date;
  } {
    return {
      shopUrl: this.credentials.shopUrl,
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
      await this.listProducts(1);
      return true;
    } catch (error) {
      logger.error('Shopify health check failed', {}, error as Error);
      return false;
    }
  }
}