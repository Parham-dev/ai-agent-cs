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

/**
 * Custom MCP Server credentials interface
 * Supports secure MCP server types: hosted and streamable-http (stdio disabled for security)
 */
export interface CustomMcpCredentials {
  /** MCP server type */
  serverType: 'hosted' | 'streamable-http';
  /** Display name for the server */
  name: string;
  
  // Hosted MCP Server Tools fields
  /** Server URL for hosted MCP tools */
  serverUrl?: string;
  /** Server label for hosted MCP tools */
  serverLabel?: string;
  /** Approval requirements for hosted tools */
  requireApproval?: 'always' | 'never' | { never?: { toolNames: string[] }; always?: { toolNames: string[] } };
  
  // Streamable HTTP MCP Server fields
  /** HTTP URL for streamable HTTP servers */
  httpUrl?: string;
  /** Authentication type for HTTP servers */
  authType?: 'none' | 'bearer' | 'api-key' | 'basic';
  /** Authentication token/key */
  authToken?: string;
  /** Username for basic auth */
  username?: string;
  /** Password for basic auth */
  password?: string;
  /** Session ID for HTTP servers */
  sessionId?: string;
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
