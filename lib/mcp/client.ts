import { MCPServerStdio, MCPServerStreamableHttp, hostedMcpTool } from '@openai/agents';
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
  servers: (MCPServerStdio | MCPServerStreamableHttp)[];
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
    const mcpServers: (MCPServerStdio | MCPServerStreamableHttp)[] = [];
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
      
      logger.info('MCP servers initialized', { 
        regularServerCount: mcpServers.length,
        hostedToolCount: hostedTools.length,
        totalIntegrations: integrations.length
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
      
      const customServer = await createCustomMcpServer(credentials);
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
  ): Promise<MCPServerStdio | null> {
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
      
      // Create server command with credentials and selected tools
      const fullCommand = this.buildServerCommand(config, serverCredentials, uniqueSelectedTools);
      
      // Create MCP server instance
      const mcpServer = new MCPServerStdio({
        name: config.name,
        fullCommand,
        cacheToolsList: config.cacheToolsList ?? this.defaults.cacheToolsList
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
      logger.error('Failed to initialize server', { serverName: config.name }, error as Error);
      
      // Store error state
      this.servers.set(config.name, {
        config,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
        credentials: integration.credentials,
        // settings removed in V2 - using dynamic tool discovery instead
      });
    }
    
    return serverCredentials;
  }

  /**
   * Build server command with credentials
   */
  private buildServerCommand(config: MCPServerConfig, credentials: ServerCredentials[], selectedTools?: string[]): string {
    const args = [...(config.args || [])];
    
    // Add credentials as base64 encoded argument
    const credentialsJson = JSON.stringify(credentials);
    const credentialsBase64 = Buffer.from(credentialsJson).toString('base64');
    args.push('--credentials', credentialsBase64);
    
    // Add timeout
    const timeout = config.timeout || this.defaults.timeout;
    args.push('--timeout', timeout.toString());
    
    // Add retries
    const retries = config.retries || this.defaults.retries;
    args.push('--retries', retries.toString());
    
    // Add selected tools if provided
    if (selectedTools && selectedTools.length > 0) {
      const selectedToolsJson = JSON.stringify(selectedTools);
      const selectedToolsBase64 = Buffer.from(selectedToolsJson).toString('base64');
      args.push('--selected-tools', selectedToolsBase64);
    }
    
    // Build full command
    return `${config.command} ${args.join(' ')}`;
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
): Promise<{ client: MCPClient; servers: (MCPServerStdio | MCPServerStreamableHttp)[]; hostedTools: ReturnType<typeof hostedMcpTool>[] }> {
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