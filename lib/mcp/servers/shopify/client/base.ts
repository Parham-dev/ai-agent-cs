import { logger } from '@/lib/utils/logger';
import { MCPServerCredentials, MCPServerError } from '../types';

function cleanStoreName(storeName: string): string {
  return storeName.replace(/^https?:\/\//, '').replace(/\.myshopify\.com$/, '').replace(/\/$/, '');
}

/**
 * Base Shopify API client with common functionality
 */
export abstract class BaseShopifyClient {
  protected credentials: MCPServerCredentials['credentials'];
  protected settings: MCPServerCredentials['settings'];
  protected baseUrl: string;

  constructor(credentials: MCPServerCredentials['credentials'], settings?: MCPServerCredentials['settings']) {
    this.credentials = credentials;
    this.settings = settings || {};
    this.baseUrl = `https://${cleanStoreName(credentials.shopUrl as string)}.myshopify.com/admin/api/2024-10`;
  }

  /**
   * Make authenticated request to Shopify API
   */
  protected async makeRequest(endpoint: string): Promise<Response> {
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
   * Make GraphQL request to Shopify API
   */
  protected async makeGraphQLRequest(query: string, variables?: Record<string, unknown>): Promise<{ data: Record<string, unknown>; errors?: Array<Record<string, unknown>> }> {
    const response = await fetch(`${this.baseUrl}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': this.credentials.accessToken as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      logger.error('GraphQL errors', { errors: result.errors });
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }
    
    return result;
  }

  /**
   * Handle API errors and convert to MCP server errors
   */
  protected handleError(error: unknown, operation: string): MCPServerError {
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
   * Validate credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      logger.debug('Validating Shopify credentials');
      
      // Test with a simple API call
      const response = await this.makeRequest('/products.json?limit=1');
      
      if (!response.ok) {
        logger.error('Shopify credentials validation failed', { status: response.status });
        return false;
      }
      
      logger.info('Shopify credentials validated', { 
        shopDomain: this.credentials.shopUrl
      });
      
      return true;
      
    } catch (error) {
      logger.error('Shopify credentials validation failed', {}, error as Error);
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/products.json?limit=1');
      return response.ok;
    } catch (error) {
      logger.error('Shopify health check failed', {}, error as Error);
      return false;
    }
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
      shopUrl: this.credentials.shopUrl as string,
      apiVersion: '2024-10',
      connected: true, // Simplified for now
      lastActivity: new Date()
    };
  }
}