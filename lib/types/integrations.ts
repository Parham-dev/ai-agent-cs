// Integration Type Definitions

export interface IntegrationCredentials {
  // Shopify credentials
  storeName?: string;
  accessToken?: string;
  
  // Stripe credentials  
  secretKey?: string;
  publicKey?: string;
  
  // Generic OAuth credentials
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  
  // API Key credentials
  apiKey?: string;
  apiSecret?: string;
  
  // Allow additional fields for future integrations
  [key: string]: string | undefined;
}

export interface ConfiguredIntegration {
  id: string;
  name: string;
  type: string;
  credentials: IntegrationCredentials;
  selectedTools: string[];
  isConnected: boolean;
  icon?: string;
  color?: string;
}
