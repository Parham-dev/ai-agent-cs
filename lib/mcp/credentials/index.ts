import { 
  CompositeCredentialProvider,
  EnvCredentialProvider,
  HeaderCredentialProvider,
  type CredentialProvider
} from './provider';

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
export const credentialProviders: Record<string, CredentialProvider> = {
  shopify: new CompositeCredentialProvider<ShopifyCredentials>('shopify', [
    // Try request headers first (for authenticated requests)
    new HeaderCredentialProvider('shopify-headers', {
      shopUrl: 'x-shopify-shop-url',
      accessToken: 'x-shopify-access-token'
    }),
    // Fall back to environment variables (for development/testing)
    new EnvCredentialProvider('shopify-env', {
      shopUrl: 'TEST_SHOPIFY_SHOP_URL',
      accessToken: 'TEST_SHOPIFY_ACCESS_TOKEN'
    })
  ]),

  stripe: new CompositeCredentialProvider<StripeCredentials>('stripe', [
    new HeaderCredentialProvider('stripe-headers', {
      secretKey: 'x-stripe-secret-key'
    }),
    new EnvCredentialProvider('stripe-env', {
      secretKey: 'STRIPE_SECRET_KEY'
    })
  ]),

  custom: new EnvCredentialProvider<Record<string, never>>('custom', {})
};

/**
 * Get credential provider for a specific integration type
 */
export function getCredentialProvider(integrationType: string): CredentialProvider | null {
  return credentialProviders[integrationType] || null;
}

/**
 * Convenience function to get credentials for a specific integration
 */
export async function getIntegrationCredentials<T = Record<string, unknown>>(
  integrationType: string,
  context?: unknown
): Promise<T | null> {
  const provider = getCredentialProvider(integrationType);
  if (!provider) {
    return null;
  }
  
  return await provider.getCredentials(context) as T | null;
}

// Re-export types and classes
export * from './provider';