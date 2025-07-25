import { createMcpHandler } from "mcp-handler";
import { getMcpServerConfig } from '@/lib/mcp/config/registry';
import { logger } from '@/lib/utils/logger';
import { NextResponse } from 'next/server';

// Configure runtime for Node.js
export const runtime = 'nodejs';

/**
 * Dynamic MCP Route Handler using standard mcp-handler
 * Uses Node.js runtime for full feature support
 */

// Handle CORS preflight requests
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-mcp-selected-tools',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function createHandler(
  request: Request, 
  { params }: { params: Promise<{ server: string }> }
) {
  const { server: serverName } = await params;
  
  logger.info('🔍 MCP ROUTE DEBUG - Request received', {
    serverName,
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Extract selected tools from request headers or query params
    let selectedTools: string[] | undefined;
    
    const selectedToolsHeader = request.headers.get('x-mcp-selected-tools');
    if (selectedToolsHeader) {
      try {
        selectedTools = JSON.parse(selectedToolsHeader);
      } catch (e) {
        logger.warn('Failed to parse selected tools header', { error: e });
      }
    }
    
    if (!selectedTools) {
      const url = new URL(request.url);
      const selectedToolsParam = url.searchParams.get('selectedTools');
      if (selectedToolsParam) {
        selectedTools = selectedToolsParam.split(',');
      }
    }

    logger.info('MCP request received', {
      serverName,
      selectedTools,
      hasSelectedTools: !!selectedTools
    });
    
    // Get server configuration
    const config = await getMcpServerConfig(serverName, selectedTools);
    
    if (!config) {
      logger.error('MCP server not found', { serverName });
      return NextResponse.json(
        { error: `MCP server '${serverName}' not found` },
        { status: 404 }
      );
    }

    // Create MCP handler using the standard library approach
    const handler = createMcpHandler(
      (server) => {
        logger.info('MCP Server initializing', { 
          serverName: config.name,
          toolCount: config.tools.length
        });

        // Register all tools
        for (const tool of config.tools) {
          server.tool(
            tool.name,
            tool.description,
            tool.inputSchema,
            async (params, extra) => {
              try {
                // Get credentials if available
                let credentials = null;
                if (config.getCredentials) {
                  credentials = await config.getCredentials(request);
                  
                  if (!credentials) {
                    throw new Error(`${config.name} credentials not found. Please configure integration.`);
                  }
                }

                logger.info('Executing tool', { 
                  serverName: config.name,
                  toolName: tool.name, 
                  hasCredentials: !!credentials
                });

                // Execute the tool
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
        }

        logger.info('MCP server setup complete', { 
          serverName: config.name,
          registeredTools: config.tools.length 
        });
      },
      {
        serverInfo: {
          name: config.name,
          version: config.version
        }
      }
    );
    
    // Handle the request with the MCP handler
    return await handler(request);
    
  } catch (error) {
    logger.error('Failed to handle MCP request', { 
      serverName,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export the handler for all HTTP methods
export { createHandler as GET, createHandler as POST, createHandler as DELETE };