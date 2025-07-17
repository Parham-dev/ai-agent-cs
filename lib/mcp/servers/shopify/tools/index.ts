/**
 * Shopify MCP Server Tools
 * 
 * This file exports all available tools for the Shopify MCP server
 */

import { searchProductsTool } from './search-products';
import { getProductDetailsTool } from './get-product-details';
import { listProductsTool } from './list-products';
import { getLocationsTool } from './get-locations';
import { getInventoryLevelsTool } from './get-inventory-levels';
import { getPoliciesTool } from './get-policies';
import { getMarketingEventsTool } from './get-marketing-events';
import { getPagesTool } from './get-pages';
import { getPaymentTermsTool } from './get-payment-terms';
import { getProductListingsTool } from './get-product-listings';
import { getShippingZonesTool } from './get-shipping-zones';
import { getLocalesTool } from './get-locales';

export { 
  searchProductsTool, 
  getProductDetailsTool, 
  listProductsTool,
  getLocationsTool,
  getInventoryLevelsTool,
  getPoliciesTool,
  getMarketingEventsTool,
  getPagesTool,
  getPaymentTermsTool,
  getProductListingsTool,
  getShippingZonesTool,
  getLocalesTool
};

// Tool registry for easier management
export const SHOPIFY_TOOLS = {
  searchProducts: searchProductsTool,
  getProductDetails: getProductDetailsTool,
  listProducts: listProductsTool,
  getLocations: getLocationsTool,
  getInventoryLevels: getInventoryLevelsTool,
  getPolicies: getPoliciesTool,
  getMarketingEvents: getMarketingEventsTool,
  getPages: getPagesTool,
  getPaymentTerms: getPaymentTermsTool,
  getProductListings: getProductListingsTool,
  getShippingZones: getShippingZonesTool,
  getLocales: getLocalesTool
};

// Get all tool names
export const TOOL_NAMES = Object.keys(SHOPIFY_TOOLS);

// Get all tools as array
export const ALL_TOOLS = Object.values(SHOPIFY_TOOLS);

// Tool metadata
export const TOOL_METADATA = {
  searchProducts: {
    category: 'search',
    description: 'Search for products by various criteria',
    complexity: 'simple',
    requiresAuth: true
  },
  getProductDetails: {
    category: 'read',
    description: 'Get detailed information about a specific product',
    complexity: 'simple',
    requiresAuth: true
  },
  listProducts: {
    category: 'read',
    description: 'List products with optional filtering',
    complexity: 'simple',
    requiresAuth: true
  },
  getLocations: {
    category: 'read',
    description: 'Get store locations with address and contact information',
    complexity: 'simple',
    requiresAuth: true
  },
  getInventoryLevels: {
    category: 'read',
    description: 'Get inventory levels for products at specific locations',
    complexity: 'simple',
    requiresAuth: true
  },
  getPolicies: {
    category: 'read',
    description: 'Get store legal policies (privacy, terms, refund, etc.)',
    complexity: 'simple',
    requiresAuth: true
  },
  getMarketingEvents: {
    category: 'read',
    description: 'Get marketing events and campaigns',
    complexity: 'simple',
    requiresAuth: true
  },
  getPages: {
    category: 'read',
    description: 'Get online store pages (about, contact, etc.)',
    complexity: 'simple',
    requiresAuth: true
  },
  getPaymentTerms: {
    category: 'read',
    description: 'Get payment terms configured for the store',
    complexity: 'simple',
    requiresAuth: true
  },
  getProductListings: {
    category: 'read',
    description: 'Get product listings for online store (published products)',
    complexity: 'simple',
    requiresAuth: true
  },
  getShippingZones: {
    category: 'read',
    description: 'Get shipping zones and rates configured for the store',
    complexity: 'simple',
    requiresAuth: true
  },
  getLocales: {
    category: 'read',
    description: 'Get available languages and locales for the store',
    complexity: 'simple',
    requiresAuth: true
  }
};

// Validate tool configuration
export function validateToolsConfiguration(): string[] {
  const errors: string[] = [];
  
  for (const [name, tool] of Object.entries(SHOPIFY_TOOLS)) {
    if (!tool.name) {
      errors.push(`Tool ${name} is missing name property`);
    }
    
    if (!tool.description) {
      errors.push(`Tool ${name} is missing description property`);
    }
    
    if (!tool.inputSchema) {
      errors.push(`Tool ${name} is missing inputSchema property`);
    }
    
    if (!tool.handler) {
      errors.push(`Tool ${name} is missing handler function`);
    }
  }
  
  return errors;
}