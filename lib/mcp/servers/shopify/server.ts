#!/usr/bin/env node

/**
 * Shopify MCP Server
 * 
 * This file implements a Model Context Protocol (MCP) server for Shopify integration
 * using the stdio transport method.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '@/lib/utils/logger';
import { ALL_TOOLS, TOOL_NAMES, validateToolsConfiguration } from './tools';
import { MCPServerCredentials, MCPToolContext } from './types';

/**
 * Shopify MCP Server Class
 */
class ShopifyMCPServer {
  private server: Server;
  private credentials: MCPServerCredentials[] = [];
  private tools: Array<{ name: string; description: string; inputSchema: unknown; handler: (params: unknown, context: MCPToolContext) => Promise<unknown> }> = [];
  private requestCounter = 0;

  constructor() {
    this.server = new Server(
      {
        name: 'shopify-mcp-server',
        version: '1.0.0',
        description: 'Shopify integration MCP server providing e-commerce tools'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers() {
    // Handle tool listing requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Received list_tools request');
      
      return {
        tools: this.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    });

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.debug('Received call_tool request', { 
        toolName: name,
        args: args ? Object.keys(args) : []
      });

      // Find the tool
      const tool = this.tools.find(t => t.name === name);
      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }

      // Create tool context
      const context: MCPToolContext = {
        credentials: this.getCredentialsForTool(name),
        settings: this.getSettingsForTool(name),
        requestId: this.generateRequestId(),
        timestamp: new Date()
      };

      // Execute the tool
      try {
        const result = await tool.handler(args, context);
        
        logger.debug('Tool execution completed', {
          toolName: name,
          success: (result as { success: boolean }).success,
          requestId: context.requestId
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Tool execution failed', {
          toolName: name,
          requestId: context.requestId
        }, error as Error);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: {
                  code: 'TOOL_EXECUTION_ERROR',
                  message: error instanceof Error ? error.message : 'Unknown error',
                  details: error
                }
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
  }

  /**
   * Initialize server with credentials
   */
  async initialize(credentials: MCPServerCredentials[], options: Record<string, unknown> = {}) {
    logger.info('Initializing Shopify MCP server', {
      credentialCount: credentials.length,
      options
    });

    this.credentials = credentials;

    // Validate tools configuration
    const toolErrors = validateToolsConfiguration();
    if (toolErrors.length > 0) {
      logger.error('Tool configuration validation failed', { errors: toolErrors });
      throw new Error(`Tool configuration errors: ${toolErrors.join(', ')}`);
    }

    // Load tools (filter by selectedTools if provided)
    const selectedTools = options.selectedTools as string[] | undefined;
    
    // Debug logging
    logger.info('MCP Server tool loading debug', {
      hasSelectedTools: !!selectedTools,
      selectedToolsCount: selectedTools?.length || 0,
      selectedTools: selectedTools || [],
      allAvailableToolsCount: ALL_TOOLS.length,
      allAvailableTools: ALL_TOOLS.map(tool => tool.name)
    });
    
    const availableTools = selectedTools ? 
      ALL_TOOLS.filter(tool => selectedTools.includes(tool.name)) : 
      ALL_TOOLS;
    
    this.tools = availableTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handler: tool.handler as (params: unknown, context: MCPToolContext) => Promise<unknown>
    }));
    
    logger.info('Final tools registered', {
      registeredToolsCount: this.tools.length,
      registeredTools: this.tools.map(t => t.name),
      wasFiltered: !!selectedTools,
      originalSelectedTools: selectedTools || []
    });

    // Validate credentials
    await this.validateCredentials();

    logger.info('Shopify MCP server initialized successfully', {
      toolCount: this.tools.length,
      toolNames: TOOL_NAMES
    });
  }

  /**
   * Start the server
   */
  async start() {
    logger.info('Starting Shopify MCP server');
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    logger.info('Shopify MCP server started and listening on stdio');
  }

  /**
   * Stop the server
   */
  async stop() {
    logger.info('Stopping Shopify MCP server');
    await this.server.close();
    logger.info('Shopify MCP server stopped');
  }

  /**
   * Validate credentials
   */
  private async validateCredentials() {
    for (const credential of this.credentials) {
      if (credential.type !== 'shopify') {
        logger.warn('Unsupported credential type', { type: credential.type });
        continue;
      }

      const required = ['shopUrl', 'accessToken'];
      const missing = required.filter(field => !(credential.credentials as Record<string, unknown>)[field]);
      
      if (missing.length > 0) {
        throw new Error(`Missing required Shopify credentials: ${missing.join(', ')}`);
      }

      logger.debug('Shopify credentials validated', {
        shopDomain: credential.credentials.shopUrl
      });
    }
  }

  /**
   * Get credentials for a specific tool
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getCredentialsForTool(_toolName: string): MCPServerCredentials['credentials'] {
    // For now, return the first available Shopify credentials
    // In the future, this could be more sophisticated based on toolName
    const shopifyCredentials = this.credentials.find(c => c.type === 'shopify');
    if (!shopifyCredentials) {
      throw new Error('No Shopify credentials available');
    }
    
    return shopifyCredentials.credentials;
  }

  /**
   * Get settings for a specific tool
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getSettingsForTool(_toolName: string): MCPServerCredentials['settings'] {
    // For now, return the first available Shopify settings
    // In the future, this could be more sophisticated based on toolName
    const shopifyCredentials = this.credentials.find(c => c.type === 'shopify');
    return shopifyCredentials?.settings || {};
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }
}

/**
 * Main server execution
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const credentialsIndex = args.indexOf('--credentials');
    const timeoutIndex = args.indexOf('--timeout');
    const retriesIndex = args.indexOf('--retries');
    const selectedToolsIndex = args.indexOf('--selected-tools');

    if (credentialsIndex === -1 || credentialsIndex + 1 >= args.length) {
      throw new Error('Missing --credentials argument');
    }

    // Decode credentials
    const credentialsBase64 = args[credentialsIndex + 1];
    const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString();
    const credentials: MCPServerCredentials[] = JSON.parse(credentialsJson);

    // Decode selected tools if provided
    let selectedTools: string[] | undefined;
    if (selectedToolsIndex !== -1 && selectedToolsIndex + 1 < args.length) {
      const selectedToolsBase64 = args[selectedToolsIndex + 1];
      const selectedToolsJson = Buffer.from(selectedToolsBase64, 'base64').toString();
      selectedTools = JSON.parse(selectedToolsJson);
    }

    // Parse options
    const options = {
      timeout: timeoutIndex !== -1 ? parseInt(args[timeoutIndex + 1]) : 30000,
      retries: retriesIndex !== -1 ? parseInt(args[retriesIndex + 1]) : 3,
      selectedTools
    };

    // Create and start server
    const server = new ShopifyMCPServer();
    await server.initialize(credentials, options);
    await server.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await server.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start Shopify MCP server', {}, error as Error);
    process.exit(1);
  }
}

// Start the server if this file is executed directly
if (require.main === module) {
  main();
}

export { ShopifyMCPServer };