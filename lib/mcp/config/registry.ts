import { McpServerConfig } from '@/lib/mcp/route-factory';
import { ALL_TOOLS } from '@/lib/mcp/servers/shopify/tools';
import { getIntegrationCredentials } from '@/lib/mcp/credentials';
import { logger } from '@/lib/utils/logger';

/**
 * MCP Server Registry
 * Centralized configuration for all MCP servers
 */

/**
 * Registry of all available MCP servers
 */
const MCP_SERVER_REGISTRY: Record<string, McpServerConfig> = {
  shopify: {
    name: 'shopify-mcp-server',
    version: '2.0.0',
    endpoint: '/api/mcp/shopify',
    tools: ALL_TOOLS as Array<{
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      handler: (params: unknown, context: unknown) => Promise<unknown>;
    }>,
    getCredentials: async () => {
      logger.info('🔍 SHOPIFY CREDENTIALS DEBUG - Starting credential retrieval', {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
      
      const credentials = await getIntegrationCredentials('shopify');
      
      if (!credentials) {
        logger.error('❌ SHOPIFY CREDENTIALS DEBUG - No credentials found', {
          credentialsType: typeof credentials,
          credentialsValue: credentials,
          timestamp: new Date().toISOString()
        });
        return null;
      }
      
      // Log decrypted credentials (REMOVE THIS IN PRODUCTION!)
      logger.info('✅ SHOPIFY CREDENTIALS DEBUG - Retrieved credentials', {
        hasCredentials: !!credentials,
        credentialsType: typeof credentials,
        credentialsKeys: Object.keys(credentials || {}),
        shopUrl: (credentials as any)?.shopUrl || 'NOT_FOUND',
        accessTokenLength: (credentials as any)?.accessToken?.length || 0,
        accessTokenPrefix: (credentials as any)?.accessToken?.substring(0, 10) || 'NOT_FOUND',
        fullCredentials: credentials, // DANGER: Full credentials exposed!
        timestamp: new Date().toISOString()
      });
      
      return credentials;
    },
    maxDuration: 300,
    verboseLogs: true
  },

  stripe: {
    name: 'stripe-mcp-server',
    version: '2.0.0', 
    endpoint: '/api/mcp/stripe',
    tools: [], // TODO: Add Stripe tools when available
    getCredentials: async () => {
      const credentials = await getIntegrationCredentials('stripe');
      if (!credentials) {
        logger.warn('Stripe credentials not found');
        return null;
      }
      return credentials;
    },
    maxDuration: 300,
    verboseLogs: true
  },

  custom: {
    name: 'custom-tools-mcp-server',
    version: '2.0.0',
    endpoint: '/api/mcp/custom', 
    tools: [
      // Custom tools that don't require external credentials
      {
        name: 'get_system_info',
        description: 'Get system information and health status',
        inputSchema: {
          type: 'object',
          properties: {
            includeMetrics: {
              type: 'boolean',
              description: 'Include performance metrics',
              default: false
            }
          },
          required: []
        },
        handler: async (params: unknown) => {
          const { includeMetrics = false } = params as { includeMetrics?: boolean };

          const result = {
            system: {
              environment: process.env.NODE_ENV || 'unknown',
              timestamp: new Date().toISOString(),
              nodeVersion: process.version,
              platform: process.platform
            },
            ...(includeMetrics && {
              metrics: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
              }
            }),
            status: 'healthy'
          };

          return result;
        }
      },
      {
        name: 'echo_message',
        description: 'Echo a message with optional formatting',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message to echo back'
            },
            uppercase: {
              type: 'boolean',
              description: 'Convert to uppercase',
              default: false
            },
            prefix: {
              type: 'string',
              description: 'Prefix to add to message',
              default: ''
            }
          },
          required: ['message']
        },
        handler: async (params: unknown) => {
          const { message, uppercase = false, prefix = '' } = params as { message: string; uppercase?: boolean; prefix?: string };

          let result = prefix ? `${prefix} ${message}` : message;
          if (uppercase) {
            result = result.toUpperCase();
          }

          return { echo: result };
        }
      }
    ],
    // Custom tools don't need external credentials
    getCredentials: async () => ({}),
    maxDuration: 300,
    verboseLogs: true
  }
};

/**
 * Get MCP server configuration by server name
 */
export async function getMcpServerConfig(
  serverName: string, 
  selectedTools?: string[]
): Promise<McpServerConfig | null> {
  const config = MCP_SERVER_REGISTRY[serverName];
  
  if (!config) {
    logger.warn('MCP server configuration not found', { serverName });
    return null;
  }

  // If selectedTools is provided, filter the tools
  if (selectedTools && selectedTools.length > 0) {
    const filteredTools = config.tools.filter(tool => 
      selectedTools.includes(tool.name)
    );

    logger.debug('Retrieved MCP server configuration with filtered tools', { 
      serverName,
      originalToolCount: config.tools.length,
      selectedToolCount: selectedTools.length,
      filteredToolCount: filteredTools.length,
      selectedTools,
      filteredToolNames: filteredTools.map(t => t.name)
    });

    // Return a copy of config with filtered tools
    return {
      ...config,
      tools: filteredTools
    };
  }

  logger.debug('Retrieved MCP server configuration', { 
    serverName,
    toolCount: config.tools.length 
  });

  return config;
}

/**
 * Get all available MCP server names
 */
export function getAvailableServerNames(): string[] {
  return Object.keys(MCP_SERVER_REGISTRY);
}

/**
 * Get all MCP server configurations
 */
export function getAllMcpServerConfigs(): Record<string, McpServerConfig> {
  return { ...MCP_SERVER_REGISTRY };
}

/**
 * Register a new MCP server configuration
 */
export function registerMcpServer(serverName: string, config: McpServerConfig): void {
  if (MCP_SERVER_REGISTRY[serverName]) {
    logger.warn('Overriding existing MCP server configuration', { serverName });
  }

  MCP_SERVER_REGISTRY[serverName] = config;
  logger.info('Registered MCP server', { 
    serverName, 
    toolCount: config.tools.length 
  });
}

/**
 * Validate server configuration
 */
export function validateServerConfig(config: McpServerConfig): string[] {
  const errors: string[] = [];

  if (!config.name) {
    errors.push('Server name is required');
  }

  if (!config.version) {
    errors.push('Server version is required');
  }

  if (!config.endpoint) {
    errors.push('Server endpoint is required');
  }

  if (!config.tools || !Array.isArray(config.tools)) {
    errors.push('Tools array is required');
  }

  // Validate tools
  if (config.tools) {
    config.tools.forEach((tool, index) => {
      if (!tool.name) {
        errors.push(`Tool at index ${index} is missing name`);
      }
      if (!tool.description) {
        errors.push(`Tool at index ${index} is missing description`);
      }
      if (!tool.handler || typeof tool.handler !== 'function') {
        errors.push(`Tool at index ${index} is missing or invalid handler`);
      }
    });
  }

  return errors;
}

/**
 * Validate all registered server configurations
 */
export function validateAllServerConfigs(): Record<string, string[]> {
  const validationResults: Record<string, string[]> = {};

  for (const [serverName, config] of Object.entries(MCP_SERVER_REGISTRY)) {
    const errors = validateServerConfig(config);
    if (errors.length > 0) {
      validationResults[serverName] = errors;
    }
  }

  return validationResults;
}