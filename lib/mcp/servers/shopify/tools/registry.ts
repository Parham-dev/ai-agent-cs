import { ToolRegistry } from '@/lib/mcp/tools/registry';
import { ALL_TOOLS } from './index';

/**
 * Shopify Tool Registry
 * Pre-configured registry with all Shopify tools
 */

// Create Shopify-specific registry
export const shopifyToolRegistry = new ToolRegistry({
  validateOnRegister: true,
  allowOverrides: false
});

// Register all Shopify tools
shopifyToolRegistry.registerMany(ALL_TOOLS);

// Export convenience functions
export function getShopifyTool(name: string) {
  return shopifyToolRegistry.get(name);
}

export function getShopifyToolsByCategory(category: string) {
  return shopifyToolRegistry.getByCategory(category);
}

export function getAllShopifyTools() {
  return shopifyToolRegistry.getAll();
}

export function getShopifyToolStats() {
  return shopifyToolRegistry.getStats();
}

// Log registration stats
const stats = shopifyToolRegistry.getStats();
console.log('Shopify Tool Registry initialized:', {
  totalTools: stats.total,
  categories: Object.keys(stats.byCategory),
  authRequired: stats.requiresAuth
});