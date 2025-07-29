import { 
  CompositeCredentialProvider,
  EnvCredentialProvider,
  HeaderCredentialProvider,
  type CredentialProvider
} from './provider';
import { DatabaseCredentialProvider } from './database-provider';
import { JWTCredentialProvider } from './jwt-provider';
import { logger } from '@/lib/utils/logger';

/**
 * Credential Types
 */
export interface ShopifyCredentials {
  shopUrl: string;
  accessToken: string;
}

export interface StripeCredentials {
  secretKey: string;
}

/**
 * Pre-configured credential providers for each integration
 */
export const credentialProviders: Record<string, CredentialProvider<Record<string, unknown>>> = {
  shopify: new CompositeCredentialProvider<Record<string, unknown>>('shopify', [
    // Try JWT token first (for production with hosted MCP tools)
    new JWTCredentialProvider<Record<string, unknown>>('shopify-jwt', 'shopify'),
    // Try database (for production)
    new DatabaseCredentialProvider<Record<string, unknown>>('shopify'),
    // Try request headers (for authenticated requests)
    new HeaderCredentialProvider<Record<string, unknown>>('shopify-headers', {
      shopUrl: 'x-shopify-shop-url',
      accessToken: 'x-shopify-access-token'
    }),
    // Fall back to environment variables (for development/testing)
    new EnvCredentialProvider<Record<string, unknown>>('shopify-env', {
      shopUrl: 'TEST_SHOPIFY_SHOP_URL',
      accessToken: 'TEST_SHOPIFY_ACCESS_TOKEN'
    })
  ]),

  stripe: new CompositeCredentialProvider<Record<string, unknown>>('stripe', [
    new HeaderCredentialProvider<Record<string, unknown>>('stripe-headers', {
      secretKey: 'x-stripe-secret-key'
    }),
    new EnvCredentialProvider<Record<string, unknown>>('stripe-env', {
      secretKey: 'STRIPE_SECRET_KEY'
    })
  ]),

  custom: new EnvCredentialProvider<Record<string, unknown>>('custom', {})
};

/**
 * Get credential provider for a specific integration type
 */
export function getCredentialProvider(integrationType: string): CredentialProvider<Record<string, unknown>> | null {
  return credentialProviders[integrationType] || null;
}

/**
 * Convenience function to get credentials for a specific integration
 */
export async function getIntegrationCredentials<T = Record<string, unknown>>(
  integrationType: string,
  context?: unknown
): Promise<T | null> {
  logger.debug('Getting credentials', { integrationType });
  
  const provider = getCredentialProvider(integrationType);
  if (!provider) {
    logger.warn('No credential provider found', {
      integrationType,
      availableProviders: Object.keys(credentialProviders)
    });
    return null;
  }
  
  try {
    const credentials = await provider.getCredentials(context);
    
    logger.debug('Credential provider result', {
      integrationType,
      hasCredentials: !!credentials,
      providerType: provider.type
    });
    
    return credentials as T | null;
  } catch (error) {
    logger.error('Credential provider error', {
      integrationType,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

// Re-export types and classes
export * from './provider';
export { DatabaseCredentialProvider } from './database-provider';
export { JWTCredentialProvider } from './jwt-provider';