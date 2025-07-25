import { createMcpHandler } from "mcp-handler";
import { getMcpServerConfig } from '@/lib/mcp/config/registry';
import { logger } from '@/lib/utils/logger';

// Configure runtime for Node.js
export const runtime = 'nodejs';

/**
 * Universal MCP Route Handler
 * Handles MCP requests for all integrated services
 */

// Store request context for access in handler
let currentRequest: Request | null = null;

const handler = createMcpHandler(
  async (server) => {
    // Get integration type from headers
    const integrationType = currentRequest?.headers.get('x-mcp-integration-type');
    const selectedToolsHeader = currentRequest?.headers.get('x-mcp-selected-tools');
    
    let selectedTools: string[] | undefined;
    if (selectedToolsHeader) {
      try {
        selectedTools = JSON.parse(selectedToolsHeader);
      } catch (e) {
        logger.warn('Failed to parse selected tools header', { error: e });
      }
    }
    
    // If no integration type specified, register all available
    const serverTypes = integrationType ? [integrationType] : ['shopify', 'stripe'];
    
    for (const serverType of serverTypes) {
      try {
        // Use the selected tools from the request if this is the requested server type
        const toolsToUse = (serverType === integrationType) ? selectedTools : undefined;
        
        const config = await getMcpServerConfig(serverType, toolsToUse);
        
        if (!config) {
          logger.warn(`MCP server config not found for ${serverType}`);
          continue;
        }


        // Register all tools for this server
        for (const tool of config.tools) {
          // Prefix tool name with server type to avoid conflicts
          const toolName = `${serverType}_${tool.name}`;
          
          server.tool(
            toolName,
            `[${serverType.toUpperCase()}] ${tool.description}`,
            tool.inputSchema,
            async (params, extra) => {
              try {

                // Get credentials for this server type
                let credentials = null;
                if (config.getCredentials && currentRequest) {
                  try {
                    credentials = await config.getCredentials(currentRequest);
                    if (!credentials) {
                      throw new Error(`${config.name} credentials not found. Please configure integration.`);
                    }
                  } catch (credError) {
                    logger.error(`Failed to get credentials for ${serverType}`, {
                      error: credError instanceof Error ? credError.message : String(credError)
                    });
                    throw credError;
                  }
                }

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
                logger.error(`Tool execution failed`, { 
                  serverType,
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
        }
      } catch (error) {
        logger.error(`Failed to register server ${serverType}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

  },
  {
    // Server options
    serverInfo: {
      name: 'ai-customer-service-mcp',
      version: '1.0.0'
    }
  },
  {
    // Handler configuration
    basePath: '/api',
    maxDuration: 300,
    verboseLogs: false
  }
);

// Wrap the handler to capture the request
async function wrappedHandler(request: Request) {
  currentRequest = request;
  
  // Log request details for debugging
  logger.info('MCP request received', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    userAgent: request.headers.get('user-agent') ?? undefined
  });
  
  try {
    const response = await handler(request);
    logger.info('MCP request completed successfully', {
      status: response.status
    });
    return response;
  } catch (error) {
    logger.error('MCP request failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  } finally {
    currentRequest = null;
  }
}

// Export the wrapped handler for all HTTP methods
export { wrappedHandler as GET, wrappedHandler as POST };

// Handle CORS preflight requests
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-mcp-selected-tools, x-mcp-integration-type, x-mcp-integration-name, mcp-protocol-version',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}