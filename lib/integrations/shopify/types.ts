// Shopify Integration Type Definitions

export interface ShopifyCredentials {
  shopUrl: string;
  accessToken: string;
}

export interface ShopifyShopResponse {
  shop: {
    id: number;
    name: string;
    domain: string;
    email: string;
    phone?: string;
    country_name: string;
    currency: string;
  };
}

export interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string;
  inventory_quantity: number;
  available: boolean;
  weight: number;
  weight_unit: string;
}

export interface ShopifyImage {
  id: number;
  src: string;
  alt: string | null;
}

export interface ShopifyOption {
  id: number;
  name: string;
  values: string[];
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
}

export interface ProductSummary {
  id: number;
  title: string;
  vendor: string;
  productType: string;
  status: string;
  tags: string;
  priceRange: {
    min: number;
    max: number;
  };
  totalInventory: number;
  handle: string;
  variantCount: number;
}

export interface ProductListItem {
  id: number;
  title: string;
  vendor: string;
  productType: string;
  status: string;
  priceRange: {
    min: number;
    max: number;
  };
  totalInventory: number;
  handle: string;
}

export interface ValidationResponse {
  isValid: boolean;
  message: string;
  storeInfo?: {
    name: string;
    domain: string;
    email: string;
    country: string;
    currency: string;
  };
} 