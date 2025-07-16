/**
 * TypeScript interfaces for Shopify MCP server
 */

// Re-export types from the existing integration for compatibility
export * from '@/lib/integrations/shopify/types';

// Additional MCP-specific types
export interface MCPServerCredentials {
  type: 'shopify';
  credentials: {
    shopDomain: string;
    accessToken: string;
    apiVersion?: string;
  };
  settings?: {
    timeout?: number;
    retries?: number;
    rateLimit?: {
      requestsPerSecond: number;
      burstLimit: number;
    };
  };
}

export interface MCPToolContext {
  credentials: MCPServerCredentials['credentials'];
  settings: MCPServerCredentials['settings'];
  requestId: string;
  timestamp: Date;
}

export interface MCPToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    requestId: string;
    timestamp: Date;
    executionTime: number;
  };
}

// Tool parameter types
export interface SearchProductsParams {
  query: string;
  limit?: number;
}

export interface GetProductDetailsParams {
  productId: string;
}

export interface ListProductsParams {
  limit?: number;
  status?: 'active' | 'archived' | 'draft';
}

// Tool response types
export interface SearchProductsResponse {
  products: Array<{
    id: string;
    title: string;
    handle: string;
    vendor: string;
    productType: string;
    tags: string[];
    status: string;
    variants: Array<{
      id: string;
      price: string;
      availableForSale: boolean;
      inventoryQuantity: number;
    }>;
    images: Array<{
      id: string;
      src: string;
      altText?: string;
    }>;
  }>;
  totalCount: number;
}

export interface GetProductDetailsResponse {
  product: {
    id: string;
    title: string;
    handle: string;
    description: string;
    vendor: string;
    productType: string;
    tags: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
    variants: Array<{
      id: string;
      title: string;
      price: string;
      compareAtPrice?: string;
      sku: string;
      barcode?: string;
      availableForSale: boolean;
      inventoryQuantity: number;
      weight: number;
      weightUnit: string;
      requiresShipping: boolean;
      taxable: boolean;
      inventoryPolicy: string;
      fulfillmentService: string;
      inventoryManagement: string;
      position: number;
      createdAt: string;
      updatedAt: string;
    }>;
    images: Array<{
      id: string;
      src: string;
      altText?: string;
      width: number;
      height: number;
      position: number;
      createdAt: string;
      updatedAt: string;
    }>;
    options: Array<{
      id: string;
      name: string;
      position: number;
      values: string[];
    }>;
    seo: {
      title?: string;
      description?: string;
    };
  };
}

export interface ListProductsResponse {
  products: Array<{
    id: string;
    title: string;
    handle: string;
    vendor: string;
    productType: string;
    tags: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
    variantCount: number;
    imageCount: number;
    totalInventory: number;
    minPrice: string;
    maxPrice: string;
  }>;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Error types
export interface ShopifyAPIError {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface MCPServerError {
  type: 'validation' | 'authentication' | 'api' | 'network' | 'server';
  code: string;
  message: string;
  originalError?: unknown;
  context?: unknown;
}

// Configuration types
export interface ShopifyMCPServerConfig {
  name: string;
  version: string;
  description: string;
  tools: string[];
  maxConcurrentRequests: number;
  requestTimeout: number;
  retryAttempts: number;
  cacheSettings: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabled: boolean;
  };
}