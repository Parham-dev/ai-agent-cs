/**
 * TypeScript interfaces for Shopify MCP server
 */

// Core Shopify types
export interface ShopifyCredentials {
  shopUrl: string;
  accessToken: string;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  status: string;
  tags: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: ShopifyOption[];
  collections?: Array<{
    id: string;
    title: string;
  }>;
  priceRange?: {
    min: string;
    max: string;
  };
  onSale?: boolean;
  totalInventory?: number;
  onlineStoreUrl?: string;
}

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  compareAtPrice?: string;
  sku: string;
  barcode?: string;
  inventory_quantity: number;
  inventoryQuantity?: number;
  available: boolean;
  availableForSale?: boolean;
  weight: number;
  weight_unit: string;
  weightUnit?: string;
  onSale?: boolean;
  salePercentage?: number;
}

export interface ShopifyImage {
  id: number;
  src: string;
  url?: string;
  alt: string | null;
  altText?: string;
}

export interface ShopifyOption {
  id: number;
  name: string;
  values: string[];
}

// New Admin API types
export interface ShopifyLocation {
  id: number;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
  province: string;
  country: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  country_code: string;
  country_name: string;
  province_code: string;
  legacy: boolean;
  active: boolean;
  admin_graphql_api_id: string;
  localized_country_name: string;
  localized_province_name: string;
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at: string;
  admin_graphql_api_id: string;
}

export interface ShopifyInventoryItem {
  id: number;
  sku: string;
  created_at: string;
  updated_at: string;
  requires_shipping: boolean;
  cost: string;
  country_code_of_origin: string;
  province_code_of_origin: string;
  harmonized_system_code: string;
  tracked: boolean;
  country_harmonized_system_codes: Record<string, unknown>[];
  admin_graphql_api_id: string;
}

export interface ShopifyPolicy {
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  handle: string;
  id: number;
  url: string;
}

export interface ShopifyMarketingEvent {
  id: number;
  event_type: string;
  marketing_channel: string;
  paid: boolean;
  referring_domain: string;
  budget: string;
  currency: string;
  budget_type: string;
  started_at: string;
  ended_at: string;
  scheduled_to_end_at: string;
  utm_campaign: string;
  utm_source: string;
  utm_medium: string;
  event_target: string;
  description: string;
  manage_url: string;
  preview_url: string;
  utm_parameters: Record<string, string>;
  marketed_resources: Array<{
    id: number;
    type: string;
  }>;
  remote_id: string;
  admin_graphql_api_id: string;
}

export interface ShopifyPage {
  id: number;
  title: string;
  shop_id: number;
  handle: string;
  body_html: string;
  author: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  template_suffix: string;
  admin_graphql_api_id: string;
}

export interface ShopifyNavigation {
  id: number;
  handle: string;
  title: string;
  updated_at: string;
  body_html: string;
  published_at: string;
  summary_only: boolean;
  template_suffix: string;
  tags: string;
  admin_graphql_api_id: string;
}

export interface ShopifyPaymentTerm {
  id: number;
  name: string;
  net_payment_term_days: number;
  payment_schedules: Array<{
    id: number;
    percentage: number;
    issued_at: string;
    due_at: string;
    completed_at: string;
    expected_amount: string;
    amount: string;
  }>;
  type: string;
  payment_terms_type: string;
  due_in_days: number;
  created_at: string;
  updated_at: string;
  admin_graphql_api_id: string;
}

export interface ShopifyProductListing {
  product_id: number;
  created_at: string;
  updated_at: string;
  body_html: string;
  handle: string;
  product_type: string;
  title: string;
  vendor: string;
  available: boolean;
  tags: string;
  published_at: string;
  variants: Array<{
    id: number;
    title: string;
    option_values: Array<{
      option_id: number;
      name: string;
      value: string;
    }>;
    price: string;
    formatted_price: string;
    compare_at_price: string;
    grams: number;
    requires_shipping: boolean;
    sku: string;
    barcode: string;
    available: boolean;
    inventory_policy: string;
    inventory_quantity: number;
    weight: number;
    weight_unit: string;
    position: number;
    created_at: string;
    updated_at: string;
  }>;
  images: Array<{
    id: number;
    created_at: string;
    position: number;
    updated_at: string;
    src: string;
    variant_ids: number[];
  }>;
  options: Array<{
    id: number;
    name: string;
    position: number;
    values: string[];
  }>;
}

export interface ShopifyShippingZone {
  id: number;
  name: string;
  profile_id: string;
  location_group_id: string;
  admin_graphql_api_id: string;
  countries: Array<{
    id: number;
    name: string;
    code: string;
    tax: number;
    provinces: Array<{
      id: number;
      name: string;
      code: string;
      tax: number;
      tax_name: string;
      tax_type: string;
      shipping_zone_id: number;
    }>;
  }>;
  weight_based_shipping_rates: Array<{
    id: number;
    weight_low: number;
    weight_high: number;
    price: string;
    name: string;
  }>;
  price_based_shipping_rates: Array<{
    id: number;
    min_order_subtotal: string;
    max_order_subtotal: string;
    price: string;
    name: string;
  }>;
  carrier_shipping_rate_providers: Array<{
    id: number;
    carrier_service_id: number;
    flat_modifier: string;
    percent_modifier: number;
    service_filter: Record<string, unknown>;
    shipping_zone_id: number;
  }>;
}

export interface ShopifyLocale {
  locale: string;
  name: string;
  primary: boolean;
  published: boolean;
}

// Additional MCP-specific types
export interface MCPServerCredentials {
  type: 'shopify';
  credentials: {
    shopUrl: string;
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
  query?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sku?: string;
  barcode?: string;
  collectionId?: string;
  limit?: number;
}

export interface GetProductDetailsParams {
  productId: string;
}

export interface ListProductsParams {
  limit?: number;
  status?: 'active' | 'archived' | 'draft' | 'all';
}

// Tool response types
export interface SearchProductsResponse {
  products: Array<{
    id: string;
    title: string;
    handle: string;
    vendor: string;
    productType: string;
    description: string;
    tags: string[];
    collections: Array<{
      id: string;
      title: string;
    }>;
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
      onSale: boolean;
      salePercentage?: number;
    }>;
    images: Array<{
      id: string;
      src: string;
      altText?: string;
    }>;
    priceRange: {
      min: string;
      max: string;
    };
    onSale: boolean;
    totalInventory: number;
    onlineStoreUrl?: string;
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