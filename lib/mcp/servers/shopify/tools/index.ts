/**
 * Shopify MCP Server Tools
 * 
 * This file exports all available tools for the Shopify MCP server
 */

import { searchProductsTool } from './search-products';
import { getProductDetailsTool } from './get-product-details';
import { listProductsTool } from './list-products';

export { searchProductsTool, getProductDetailsTool, listProductsTool };

// Tool registry for easier management
export const SHOPIFY_TOOLS = {
  searchProducts: searchProductsTool,
  getProductDetails: getProductDetailsTool,
  listProducts: listProductsTool
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