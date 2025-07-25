import { MCPServerStreamableHttp, hostedMcpTool } from '@openai/agents';
import { logger } from '@/lib/utils/logger';
import { getMcpServerConfig, getAvailableServerNames } from './config/registry';

/**
 * Simplified MCP Client
 * Clean architecture with focused responsibilities
 */

export interface MCPClientOptions {
  timeout?: number;
  retries?: number;
  cacheToolsList?: boolean;
}

export interface MCPClientResult {
  servers: MCPServerStreamableHttp[];
  hostedTools: ReturnType<typeof hostedMcpTool>[];
}

/**
 * Simplified MCP Client
 */
export class MCPClient {
  private servers: Map<string, MCPServerStreamableHttp> = new Map();
  private config: MCPClientOptions;

  constructor(config: MCPClientOptions = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      cacheToolsList: true,
      ...config
    };
  }

  /**
   * Initialize MCP servers based on integration types
   */
  async initializeServers(integrationTypes: string[]): Promise<MCPClientResult> {
    const servers: MCPServerStreamableHttp[] = [];
    const hostedTools: ReturnType<typeof hostedMcpTool>[] = [];

    // Get unique integration types
    const uniqueTypes = [...new Set(integrationTypes)];
    
    logger.info('Initializing MCP servers', { 
      requestedTypes: uniqueTypes,
      availableTypes: getAvailableServerNames()
    });

    for (const integrationType of uniqueTypes) {
      try {
        const server = await this.createServer(integrationType);
        if (server) {
          servers.push(server);
          this.servers.set(integrationType, server);
        }
      } catch (error) {
        logger.error('Failed to create MCP server', {
          integrationType,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logger.info('MCP servers initialized', {
      requested: uniqueTypes.length,
      created: servers.length,
      failed: uniqueTypes.length - servers.length
    });

    return { servers, hostedTools };
  }

  /**
   * Create a single MCP server
   */
  private async createServer(integrationType: string): Promise<MCPServerStreamableHttp | null> {
    const config = await getMcpServerConfig(integrationType);
    
    if (!config) {
      logger.warn('No configuration found for integration type', { integrationType });
      return null;
    }

    // Construct server URL
    const baseUrl = this.getBaseUrl();
    const serverUrl = `${baseUrl}${config.endpoint}`;

    // Create MCP server
    const server = new MCPServerStreamableHttp({
      name: config.name,
      url: serverUrl,
      cacheToolsList: this.config.cacheToolsList,
      // Add reconnection options for production
      ...(process.env.NODE_ENV === 'production' && {
        reconnectionOptions: {
          maxAttempts: 5,
          initialDelay: 1000,
          maxDelay: 10000
        }
      })
    });

    // Connect to server
    try {
      await server.connect();
      logger.info('MCP server connected', {
        name: config.name,
        url: serverUrl,
        integrationType
      });
      return server;
    } catch (error) {
      logger.error('Failed to connect to MCP server', {
        name: config.name,
        url: serverUrl,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Get base URL for server connections
   */
  private getBaseUrl(): string {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Use custom domain in production to avoid self-referencing calls
    let baseUrl = isProduction 
      ? 'cs.scrumble.ai'  // Use your custom domain in production
      : (process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3000');
    
    // Remove protocol if present
    baseUrl = baseUrl.replace(/^https?:\/\//, '');
    
    const protocol = isProduction ? 'https' : 'http';
    return `${protocol}://${baseUrl}`;
  }

  /**
   * Close all server connections
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.servers.values()).map(server =>
      server.close().catch(error => {
        logger.error('Failed to close server', { error });
      })
    );

    await Promise.all(closePromises);
    this.servers.clear();
    
    logger.info('All MCP servers closed');
  }

  /**
   * Get connected server names
   */
  getConnectedServers(): string[] {
    return Array.from(this.servers.keys());
  }

  /**
   * Get server by integration type
   */
  getServer(integrationType: string): MCPServerStreamableHttp | undefined {
    return this.servers.get(integrationType);
  }
}

/**
 * Factory function to create MCP client with integrations
 */
export async function createMCPClient(
  integrations: Array<{ type: string; [key: string]: unknown }>,
  config?: MCPClientOptions
): Promise<{ client: MCPClient; servers: MCPServerStreamableHttp[]; hostedTools: ReturnType<typeof hostedMcpTool>[] }> {
  const client = new MCPClient(config);
  const integrationTypes = integrations.map(i => i.type);
  const result = await client.initializeServers(integrationTypes);
  
  return { 
    client, 
    servers: result.servers, 
    hostedTools: result.hostedTools 
  };
}