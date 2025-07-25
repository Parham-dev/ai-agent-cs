import { logger } from '@/lib/utils/logger';
import { 
  getIntegrationCredentials as getCredentials,
  type ShopifyCredentials 
} from '@/lib/mcp/credentials';

/**
 * Credential management utilities for MCP servers
 * This file now acts as a compatibility layer for the new credential system
 */

export { ShopifyCredentials };

/**
 * Get Shopify credentials from request context
 * @deprecated Use getIntegrationCredentials from '@/lib/mcp/credentials' instead
 */
export async function getShopifyCredentials(request?: Request | unknown): Promise<ShopifyCredentials | null> {
  return await getCredentials<ShopifyCredentials>('shopify', request);
}

/**
 * Validate Shopify credentials format
 */
export function validateShopifyCredentials(credentials: ShopifyCredentials): boolean {
  if (!credentials.shopUrl || !credentials.accessToken) {
    return false;
  }

  // Basic validation of shop URL format
  const shopUrlPattern = /^https:\/\/[a-zA-Z0-9\-]+\.myshopify\.com$/;
  if (!shopUrlPattern.test(credentials.shopUrl)) {
    logger.warn('Invalid Shopify shop URL format', { shopUrl: credentials.shopUrl });
    return false;
  }

  // Basic validation of access token (should be a non-empty string)
  if (typeof credentials.accessToken !== 'string' || credentials.accessToken.length < 10) {
    logger.warn('Invalid Shopify access token format');
    return false;
  }

  return true;
}

/**
 * Get credentials for other integration types
 * @deprecated Use getIntegrationCredentials from '@/lib/mcp/credentials' instead
 */
export async function getIntegrationCredentials(
  request: Request | unknown, 
  integrationType: 'shopify' | 'stripe' | 'custom'
): Promise<Record<string, unknown> | null> {
  return await getCredentials(integrationType, request);
}