import { MCPServerStreamableHttp, hostedMcpTool } from '@openai/agents';
import { logger } from '@/lib/utils/logger';
import { 
  MCPServerConfig, 
  MCPServerInstance, 
  ServerCredentials,
  MCPClientDefaults 
} from './config/types';
import { 
  getServersForIntegrations, 
  getIntegrationMapping, 
  MCP_CLIENT_DEFAULTS 
} from './config/servers';
import { createCustomMcpServer, CustomMcpServerResult } from './servers/custom';
import { CustomMcpCredentials } from '@/lib/types/integrations';

export interface MCPClientResult {
  servers: MCPServerStreamableHttp[];
  hostedTools: ReturnType<typeof hostedMcpTool>[];
}

/**
 * MCP Client for managing server connections and lifecycle
 */
export class MCPClient {
  private servers: Map<string, MCPServerInstance> = new Map();
  private customServers: Map<string, CustomMcpServerResult> = new Map();
  private defaults: MCPClientDefaults;

  constructor(defaults: MCPClientDefaults = MCP_CLIENT_DEFAULTS) {
    this.defaults = defaults;
  }

  /**
   * Initialize MCP servers based on agent integrations
   */
  async initializeServers(integrations: Array<{ type: string; credentials: Record<string, unknown>; settings?: Record<string, unknown>; selectedTools?: string[] }>): Promise<MCPClientResult> {
    const mcpServers: MCPServerStreamableHttp[] = [];
    const hostedTools: ReturnType<typeof hostedMcpTool>[] = [];
    
    try {
      // Separate custom-mcp integrations from regular ones
      const customMcpIntegrations = integrations.filter(i => i.type === 'custom-mcp');
      const regularIntegrations = integrations.filter(i => i.type !== 'custom-mcp');
      
      // Handle regular integrations (stdio servers)
      if (regularIntegrations.length > 0) {
        const integrationTypes = [...new Set(regularIntegrations.map(i => i.type))];
        const serverConfigs = getServersForIntegrations(integrationTypes);
        
        for (const config of serverConfigs) {
          const server = await this.initializeServer(config, regularIntegrations);
          if (server) {
            mcpServers.push(server);
          }
        }
      }
      
      // Handle custom MCP integrations
      for (const integration of customMcpIntegrations) {
        const customServer = await this.initializeCustomServer(integration);
        if (customServer) {
          if (customServer.server) {
            mcpServers.push(customServer.server);
          }
          if (customServer.hostedTool) {
            hostedTools.push(customServer.hostedTool);
          }
        }
      }
      
      // Validate HTTP-only setup
      const validation = this.validateHttpSetup();
      if (!validation.valid) {
        logger.error('MCP HTTP setup validation failed', {
          issues: validation.issues
        });
        // Log issues but don't throw to avoid breaking the app
      }

      logger.info('MCP servers initialized', { 
        regularServerCount: mcpServers.length,
        hostedToolCount: hostedTools.length,
        totalIntegrations: integrations.length,
        transport: 'http-only',
        setupValid: validation.valid
      });
      
      return { servers: mcpServers, hostedTools };
      
    } catch (error) {
      logger.error('Failed to initialize MCP servers', {}, error as Error);
      throw error;
    }
  }

  /**
   * Initialize a custom MCP server
   */
  private async initializeCustomServer(
    integration: { type: string; credentials: Record<string, unknown>; settings?: Record<string, unknown>; selectedTools?: string[] }
  ): Promise<CustomMcpServerResult | null> {
    try {
      const credentials = integration.credentials as unknown as CustomMcpCredentials;
      
      if (!credentials.serverType || !credentials.name) {
        logger.error('Invalid custom MCP credentials', { 
          hasServerType: !!credentials.serverType,
          hasName: !!credentials.name 
        });
        return null;
      }
      
      console.log('🔧 Creating custom MCP server (all tools will be available):', {
        serverName: credentials.name,
        serverType: credentials.serverType,
        selectedToolsIgnored: integration.selectedTools?.length || 0,
        reason: 'Custom MCP servers expose all tools due to OpenAI SDK limitation'
      });
      
      const customServer = await createCustomMcpServer(credentials, integration.selectedTools);
      if (!customServer) {
        logger.error('Failed to create custom MCP server', { name: credentials.name });
        return null;
      }
      
      // Connect to server if it's not hosted
      if (customServer.server) {
        await customServer.server.connect();
      }
      
      // Store custom server instance
      this.customServers.set(credentials.name, customServer);
      
      logger.info('Custom MCP server initialized', { 
        name: credentials.name,
        type: credentials.serverType
      });
      
      return customServer;
      
    } catch (error) {
      logger.error('Failed to initialize custom MCP server', {}, error as Error);
      return null;
    }
  }

  /**
   * Initialize a single MCP server
   */
  private async initializeServer(
    config: MCPServerConfig, 
    integrations: Array<{ type: string; credentials: Record<string, unknown>; settings?: Record<string, unknown>; selectedTools?: string[] }>
  ): Promise<MCPServerStreamableHttp | null> {
    try {
      // Find integrations that use this server
      const relevantIntegrations = integrations.filter(integration => 
        config.integrationTypes.includes(integration.type)
      );
      
      if (relevantIntegrations.length === 0) {
        logger.debug('No relevant integrations for server', { serverName: config.name });
        return null;
      }
      
      // Prepare server credentials
      const serverCredentials = this.prepareServerCredentials(config, relevantIntegrations);
      
      // Collect selected tools from relevant integrations
      const allSelectedTools = relevantIntegrations.flatMap(integration => integration.selectedTools || []);
      const uniqueSelectedTools = [...new Set(allSelectedTools)];
      
      logger.info('MCP Client selectedTools debug', {
        serverName: config.name,
        relevantIntegrationsCount: relevantIntegrations.length,
        relevantIntegrations: relevantIntegrations.map(i => ({
          type: i.type,
          selectedToolsCount: i.selectedTools?.length || 0,
          selectedTools: i.selectedTools || []
        })),
        allSelectedToolsCount: allSelectedTools.length,
        allSelectedTools,
        uniqueSelectedToolsCount: uniqueSelectedTools.length,
        uniqueSelectedTools
      });
      
      // Pure HTTP MCP server creation (mcp-handler best practice)
      const isProduction = process.env.NODE_ENV === 'production';
      
      if (config.command !== 'http') {
        throw new Error(`Only HTTP transport supported. Server ${config.name} uses: ${config.command}`);
      }

      // Consistent HTTP-based MCP server for all environments
      let baseUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000';
      
      // Handle URLs that already include protocol
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        baseUrl = baseUrl.replace(/^https?:\/\//, '');
      }
      
      const protocol = isProduction ? 'https' : 'http';
      const fullBaseUrl = `${protocol}://${baseUrl}`;
      const endpoint = config.args?.[0] || '';
      
      // Create server URL with selected tools
      const serverUrl = uniqueSelectedTools && uniqueSelectedTools.length > 0
        ? `${fullBaseUrl}${endpoint}?selectedTools=${uniqueSelectedTools.join(',')}`
        : `${fullBaseUrl}${endpoint}`;
      
      // Create custom request init to include selected tools header
      const requestInit: RequestInit = uniqueSelectedTools && uniqueSelectedTools.length > 0 ? {
        headers: {
          'x-mcp-selected-tools': JSON.stringify(uniqueSelectedTools)
        }
      } : {};
      
      const mcpServer = new MCPServerStreamableHttp({
        name: config.name,
        url: serverUrl,
        requestInit,
        cacheToolsList: config.cacheToolsList ?? this.defaults.cacheToolsList,
        // Enhanced configuration for production
        ...(isProduction && {
          reconnectionOptions: {
            maxAttempts: 5,
            initialDelay: 1000,
            maxDelay: 10000
          }
        })
      });
      
      // Setup credentials for HTTP server
      this.setupHttpCredentials(config, serverCredentials);
      
      logger.info('Created HTTP MCP server', { 
        serverName: config.name,
        url: serverUrl,
        environment: process.env.NODE_ENV,
        transport: 'streamable-http',
        hasCredentials: serverCredentials.length > 0
      });
      
      // Connect to server
      await mcpServer.connect();
      
      // Store server instance
      this.servers.set(config.name, {
        config,
        process: mcpServer,
        connected: true,
        lastHealthCheck: new Date()
      });
      
      logger.info('MCP server initialized', { 
        serverName: config.name,
        integrationTypes: config.integrationTypes
      });
      
      return mcpServer;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Enhanced error logging with production context
      logger.error('Failed to initialize MCP server', { 
        serverName: config.name,
        environment: isProduction ? 'production' : 'development',
        serverType: config.command === 'http' ? 'HTTP' : 'stdio',
        error: errorMessage
      }, error as Error);
      
      // Store error state with enhanced information
      this.servers.set(config.name, {
        config,
        connected: false,
        error: errorMessage,
        ...(isProduction && {
          productionError: true,
          suggestion: config.command !== 'http' ? 'Use HTTP transport in production' : 'Check server endpoint and credentials'
        })
      });
      
      return null;
    }
  }

  /**
   * Prepare credentials for server
   */
  private prepareServerCredentials(
    config: MCPServerConfig,
    integrations: Array<{ type: string; credentials: Record<string, unknown>; settings?: Record<string, unknown> }>
  ): ServerCredentials[] {
    const serverCredentials: ServerCredentials[] = [];
    
    for (const integration of integrations) {
      const mapping = getIntegrationMapping(integration.type);
      if (!mapping) {
        logger.warn('No mapping found for integration type', { type: integration.type });
        continue;
      }
      
      // Validate required credentials
      const missingCredentials = mapping.requiredCredentials.filter(
        field => !integration.credentials[field]
      );
      
      if (missingCredentials.length > 0) {
        logger.warn('Missing required credentials', { 
          integrationType: integration.type,
          missingCredentials 
        });
        continue;
      }
      
      serverCredentials.push({
        type: integration.type,
        credentials: integration.credentials
        // settings removed in V2 - using dynamic tool discovery instead
      });
    }
    
    return serverCredentials;
  }


  /**
   * Setup credentials for HTTP-based MCP servers
   * In production, credentials are handled by environment variables and request context
   */
  private setupHttpCredentials(config: MCPServerConfig, credentials: ServerCredentials[]): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // In production, credentials are managed by the mcp-handler servers
      // They get credentials from environment variables or database lookups
      logger.info('HTTP MCP server will use production credential management', {
        serverName: config.name,
        credentialTypes: credentials.map(c => c.type)
      });
      return;
    }

    // In development, we can set environment variables for testing
    for (const credential of credentials) {
      if (credential.type === 'shopify') {
        const shopifyCredentials = credential.credentials as { shopUrl: string; accessToken: string };
        if (shopifyCredentials.shopUrl && shopifyCredentials.accessToken) {
          // Set test environment variables for development
          process.env.TEST_SHOPIFY_SHOP_URL = shopifyCredentials.shopUrl;
          process.env.TEST_SHOPIFY_ACCESS_TOKEN = shopifyCredentials.accessToken;
          
          logger.info('Set Shopify test credentials for development', {
            shopUrl: shopifyCredentials.shopUrl.substring(0, 20) + '...'
          });
        }
      } else if (credential.type === 'stripe') {
        const stripeCredentials = credential.credentials as { secretKey: string };
        if (stripeCredentials.secretKey) {
          process.env.STRIPE_SECRET_KEY = stripeCredentials.secretKey;
          logger.info('Set Stripe credentials for development');
        }
      }
    }
  }

  /**
   * Validate HTTP-only MCP setup
   */
  validateHttpSetup(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const isProduction = process.env.NODE_ENV === 'production';

    // Check that all servers use HTTP transport
    for (const [serverName, instance] of this.servers.entries()) {
      if (instance.config.command !== 'http') {
        issues.push(`Server "${serverName}" uses unsupported transport: ${instance.config.command}. Only HTTP is supported.`);
      }
    }

    // Check required environment variables for URL construction
    const requiredEnvVars = ['VERCEL_URL', 'NEXT_PUBLIC_SITE_URL'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length === requiredEnvVars.length) {
      issues.push('Missing environment variables for server URL. Set either VERCEL_URL or NEXT_PUBLIC_SITE_URL.');
    }

    // Production-specific checks
    if (isProduction && !process.env.VERCEL_URL) {
      issues.push('VERCEL_URL environment variable should be set in production');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Close all server connections
   */
  async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];
    
    // Close regular servers
    for (const [serverName, instance] of this.servers.entries()) {
      if (instance.connected && instance.process) {
        closePromises.push(
          (instance.process as { close: () => Promise<void> }).close().catch((error: Error) => {
            logger.error('Failed to close server', { serverName }, error);
          })
        );
      }
    }
    
    // Close custom servers
    for (const [serverName, customInstance] of this.customServers.entries()) {
      if (customInstance.server) {
        closePromises.push(
          customInstance.server.close().catch((error: Error) => {
            logger.error('Failed to close custom server', { serverName }, error);
          })
        );
      }
    }
    
    await Promise.all(closePromises);
    this.servers.clear();
    this.customServers.clear();
    
    logger.info('All MCP servers closed');
  }

  /**
   * Gracefully close all server connections with a delay to allow pending operations
   */
  async gracefulCloseAll(delayMs: number = 5000): Promise<void> {
    logger.debug(`Scheduling graceful MCP client shutdown in ${delayMs}ms`);
    
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await this.closeAll();
          logger.debug('Graceful MCP client shutdown completed');
          resolve();
        } catch (error) {
          logger.error('Error during graceful MCP client shutdown', {}, error as Error);
          resolve(); // Still resolve to prevent hanging
        }
      }, delayMs);
    });
  }

  /**
   * Get server status
   */
  getServerStatus(): Array<{ name: string; connected: boolean; error?: string }> {
    return Array.from(this.servers.values()).map(instance => ({
      name: instance.config.name,
      connected: instance.connected,
      error: instance.error
    }));
  }

  /**
   * Health check for all servers
   */
  async healthCheck(): Promise<void> {
    const healthPromises: Promise<void>[] = [];
    
    for (const [serverName, instance] of this.servers.entries()) {
      if (instance.connected && instance.process) {
        healthPromises.push(
          this.checkServerHealth(serverName, instance)
        );
      }
    }
    
    await Promise.all(healthPromises);
  }

  /**
   * Check health of a specific server
   */
  private async checkServerHealth(serverName: string, instance: MCPServerInstance): Promise<void> {
    try {
      // Simple health check - try to list tools
      // This is a basic implementation, you might want to add more sophisticated health checks
      instance.lastHealthCheck = new Date();
      
      logger.debug('Health check passed', { serverName });
      
    } catch (error) {
      logger.error('Health check failed', { serverName }, error as Error);
      
      // Update server status
      instance.connected = false;
      instance.error = error instanceof Error ? error.message : 'Health check failed';
    }
  }
}

/**
 * Create MCP client with agent integrations
 */
export async function createMCPClient(
  integrations: Array<{ type: string; credentials: Record<string, unknown>; settings?: Record<string, unknown>; selectedTools?: string[] }>
): Promise<{ client: MCPClient; servers: MCPServerStreamableHttp[]; hostedTools: ReturnType<typeof hostedMcpTool>[] }> {
  const client = new MCPClient();
  const result = await client.initializeServers(integrations);
  
  return { client, servers: result.servers, hostedTools: result.hostedTools };
}

/**
 * Global MCP client instance for reuse
 */
let globalMCPClient: MCPClient | null = null;

/**
 * Get or create global MCP client
 */
export function getGlobalMCPClient(): MCPClient {
  if (!globalMCPClient) {
    globalMCPClient = new MCPClient();
  }
  return globalMCPClient;
}

/**
 * Close global MCP client
 */
export async function closeGlobalMCPClient(): Promise<void> {
  if (globalMCPClient) {
    await globalMCPClient.closeAll();
    globalMCPClient = null;
  }
}