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
export const credentialProviders: Record<string, CredentialProvider<Record<string, unknown>>> = {
  shopify: new CompositeCredentialProvider<Record<string, unknown>>('shopify', [
    // Try request headers first (for authenticated requests)
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
  logger.info('🔍 CREDENTIAL PROVIDER DEBUG - Starting', {
    integrationType,
    hasContext: !!context,
    contextType: typeof context,
    timestamp: new Date().toISOString()
  });
  
  const provider = getCredentialProvider(integrationType);
  if (!provider) {
    logger.error('❌ CREDENTIAL PROVIDER DEBUG - No provider found', {
      integrationType,
      availableProviders: Object.keys(credentialProviders),
      timestamp: new Date().toISOString()
    });
    return null;
  }
  
  logger.info('✅ CREDENTIAL PROVIDER DEBUG - Provider found', {
    integrationType,
    providerType: provider.type,
    timestamp: new Date().toISOString()
  });
  
  try {
    const credentials = await provider.getCredentials(context);
    
    logger.info('🔍 CREDENTIAL PROVIDER DEBUG - Provider result', {
      integrationType,
      hasCredentials: !!credentials,
      credentialKeys: credentials ? Object.keys(credentials) : [],
      credentialValues: credentials, // DANGER: Full credentials exposed!
      timestamp: new Date().toISOString()
    });
    
    return credentials as T | null;
  } catch (error) {
    logger.error('❌ CREDENTIAL PROVIDER DEBUG - Provider error', {
      integrationType,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    return null;
  }
}

// Re-export types and classes
export * from './provider';