import { createMcpHandler } from 'mcp-handler';
import { logger } from '@/lib/utils/logger';

/**
 * MCP Route Factory
 * Centralized factory for creating MCP route handlers with consistent configuration
 */

export interface McpServerConfig {
  name: string;
  version: string;
  endpoint: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    handler: (params: unknown, context: unknown) => Promise<unknown>;
  }>;
  getCredentials?: (request?: Request) => Promise<Record<string, unknown> | null>;
  maxDuration?: number;
  verboseLogs?: boolean;
}

/**
 * Create a standardized MCP route handler
 */
export function createMcpRouteHandler(config: McpServerConfig) {
  // Store request in closure for access by tools
  let currentRequest: Request | null = null;
  
  // Debug wrapper to log all requests consistently
  async function debugHandler(request: Request): Promise<Response> {
    // Store the current request for tool access
    currentRequest = request;
    const method = request.method;
    const url = request.url;
    const headers = Object.fromEntries(request.headers.entries());
    
    let body = '';
    try {
      if (request.body) {
        const requestClone = request.clone();
        body = await requestClone.text();
      }
    } catch (error) {
      logger.warn('Could not read request body for debugging', { error });
    }

    logger.info('🔍 MCP Request Debug', {
      serverName: config.name,
      method,
      url,
      headers: {
        'content-type': headers['content-type'],
        'user-agent': headers['user-agent'],
        'mcp-session-id': headers['mcp-session-id']
      },
      bodyPreview: body.substring(0, 200),
      bodyLength: body.length
    });

    try {
      const response = await mcpHandler(request);
      logger.info('📤 MCP Response Debug', {
        serverName: config.name,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      return response;
    } catch (error) {
      logger.error('❌ MCP Handler Error', { 
        serverName: config.name,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  // Create the MCP handler with server configuration
  const mcpHandler = createMcpHandler(
    async (server) => {
      logger.info('MCP Server initializing', { 
        serverName: config.name,
        serverInfo: server ? 'available' : 'missing'
      });

      // Register all tools dynamically with error handling
      try {
        if (!config.tools || config.tools.length === 0) {
          logger.warn('No tools found to register', { serverName: config.name });
          return;
        }

        logger.info('Registering tools', { 
          serverName: config.name,
          count: config.tools.length 
        });

        for (const tool of config.tools) {
          try {
            if (!tool || !tool.name || !tool.handler) {
              logger.warn('Skipping invalid tool', { 
                serverName: config.name,
                tool: tool?.name || 'unknown' 
              });
              continue;
            }

            server.tool(
              tool.name,
              tool.description,
              tool.inputSchema,
              async (params, extra) => {
                try {
                  // Get credentials if credential function is provided
                  let credentials = null;
                  if (config.getCredentials) {
                    // Pass the current request context to credentials function
                    credentials = await config.getCredentials(currentRequest || undefined);
                    
                    if (!credentials) {
                      throw new Error(`${config.name} credentials not found. Please configure integration.`);
                    }
                  }

                  logger.info('Executing tool', { 
                    serverName: config.name,
                    toolName: tool.name, 
                    hasCredentials: !!credentials
                  });

                  // Execute the tool with proper context
                  const result = await tool.handler(params, { 
                    credentials, 
                    settings: {},
                    requestId: String(extra?.requestId) || 'unknown',
                    timestamp: new Date()
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
                    serverName: config.name,
                    toolName: tool.name, 
                    error: error instanceof Error ? error.message : String(error)
                  });
                  
                  return {
                    content: [
                      {
                        type: 'text',
                        text: `Error executing ${tool.name}: ${error instanceof Error ? error.message : String(error)}`
                      }
                    ],
                    isError: true
                  };
                }
              }
            );

            logger.debug('Registered tool', { 
              serverName: config.name,
              toolName: tool.name 
            });
          } catch (error) {
            logger.error('Failed to register tool', { 
              serverName: config.name,
              toolName: tool?.name || 'unknown',
              error: error instanceof Error ? error.message : String(error)
            });
            // Continue with other tools even if one fails
          }
        }

        logger.info('MCP server setup complete', { 
          serverName: config.name,
          registeredTools: config.tools.length 
        });
      } catch (error) {
        logger.error('Failed to setup MCP server', { 
          serverName: config.name,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    },
    {
      serverInfo: {
        name: config.name,
        version: config.version
      }
    },
    {
      streamableHttpEndpoint: config.endpoint,
      maxDuration: config.maxDuration || 300,
      verboseLogs: config.verboseLogs ?? (process.env.NODE_ENV === 'development'),
      disableSse: false, // Enable SSE for proper MCP protocol support
      onEvent: (event) => {
        if (event.type === 'ERROR') {
          logger.error('MCP Server Event', { serverName: config.name, event });
        } else if (process.env.NODE_ENV === 'development') {
          logger.info('MCP Server Event', { serverName: config.name, event });
        }
      }
    }
  );

  return { debugHandler, mcpHandler };
}