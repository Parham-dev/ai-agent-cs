import { MCPServerConfig, IntegrationServerMap, MCPClientDefaults } from './types';

/**
 * MCP Server Configurations
 * Central registry for all available MCP servers
 */
/**
 * Pure HTTP MCP Server Configurations (Best Practice)
 * All servers use HTTP transport with mcp-handler for consistency
 */
export const MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'Shopify MCP Server',
    command: 'http',
    args: ['/api/mcp/shopify'],
    timeout: 30000,
    retries: 3,
    cacheToolsList: true,
    integrationTypes: ['shopify'],
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    }
  },
  {
    name: 'Stripe MCP Server',
    command: 'http',
    args: ['/api/mcp/stripe'],
    timeout: 30000,
    retries: 3,
    cacheToolsList: true,
    integrationTypes: ['stripe'],
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    }
  },
  {
    name: 'Custom Tools MCP Server',
    command: 'http',
    args: ['/api/mcp/custom'],
    timeout: 30000,
    retries: 3,
    cacheToolsList: true,
    integrationTypes: ['custom'],
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    }
  }
];

/**
 * Integration to Server Mapping
 * Maps integration types to their corresponding MCP servers
 */
export const INTEGRATION_SERVER_MAP: IntegrationServerMap = {
  shopify: {
    serverName: 'Shopify MCP Server',
    requiredCredentials: ['shopUrl', 'accessToken'],
    optionalSettings: ['apiVersion', 'timeout', 'retries']
  },
  stripe: {
    serverName: 'Stripe MCP Server',
    requiredCredentials: ['secretKey'],
    optionalSettings: ['apiVersion', 'timeout', 'webhookSecret']
  },
  custom: {
    serverName: 'Custom Tools MCP Server',
    requiredCredentials: [],
    optionalSettings: ['timeout', 'retries']
  }
};

/**
 * Default MCP Client Configuration
 */
export const MCP_CLIENT_DEFAULTS: MCPClientDefaults = {
  timeout: 30000,
  retries: 3,
  cacheToolsList: true,
  logging: {
    level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    enabled: true
  }
};

/**
 * Get server configuration by name
 */
export function getServerConfig(serverName: string): MCPServerConfig | undefined {
  return MCP_SERVERS.find(server => server.name === serverName);
}

/**
 * Get servers for specific integration types
 */
export function getServersForIntegrations(integrationTypes: string[]): MCPServerConfig[] {
  return MCP_SERVERS.filter(server => 
    server.integrationTypes.some(type => integrationTypes.includes(type))
  );
}

/**
 * Get integration mapping for a specific type
 */
export function getIntegrationMapping(integrationType: string) {
  return INTEGRATION_SERVER_MAP[integrationType];
}

/**
 * Validate server configuration
 */
export function validateServerConfig(config: MCPServerConfig): string[] {
  const errors: string[] = [];
  
  if (!config.name) {
    errors.push('Server name is required');
  }
  
  if (!config.command) {
    errors.push('Server command is required');
  }
  
  if (!config.integrationTypes || config.integrationTypes.length === 0) {
    errors.push('At least one integration type is required');
  }
  
  if (config.timeout && config.timeout < 1000) {
    errors.push('Timeout must be at least 1000ms');
  }
  
  if (config.retries && config.retries < 0) {
    errors.push('Retries must be non-negative');
  }
  
  return errors;
}

/**
 * Validate integration mapping
 */
export function validateIntegrationMapping(mapping: IntegrationServerMap): string[] {
  const errors: string[] = [];
  
  for (const [integrationType, config] of Object.entries(mapping)) {
    if (!config.serverName) {
      errors.push(`Integration ${integrationType} missing server name`);
    }
    
    if (!getServerConfig(config.serverName)) {
      errors.push(`Integration ${integrationType} references non-existent server: ${config.serverName}`);
    }
    
    if (!config.requiredCredentials) {
      errors.push(`Integration ${integrationType} missing required credentials list`);
    }
  }
  
  return errors;
}

/**
 * Get all validation errors for the configuration
 */
export function validateConfiguration(): string[] {
  const errors: string[] = [];
  
  // Validate server configurations
  for (const server of MCP_SERVERS) {
    const serverErrors = validateServerConfig(server);
    errors.push(...serverErrors.map(error => `Server ${server.name}: ${error}`));
  }
  
  // Validate integration mappings
  const mappingErrors = validateIntegrationMapping(INTEGRATION_SERVER_MAP);
  errors.push(...mappingErrors);
  
  return errors;
}