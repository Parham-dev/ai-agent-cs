import { createMcpRouteHandler } from '@/lib/mcp/route-factory';
import { getMcpServerConfig } from '@/lib/mcp/config/registry';
import { logger } from '@/lib/utils/logger';

/**
 * Dynamic MCP Route Handler
 * Handles all MCP server routes based on the [server] parameter
 * Replaces individual route files for better maintainability
 */

async function createHandler(
  request: Request, 
  { params }: { params: Promise<{ server: string }> }
) {
  const { server: serverName } = await params;
  
  logger.info('🔍 MCP ROUTE DEBUG - Request received', {
    serverName,
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString()
  });
  
  // Handle SSE GET requests specially
  if (request.method === 'GET' && request.headers.get('accept')?.includes('text/event-stream')) {
    logger.info('Handling SSE GET request', { serverName });
    
    try {
      // Get server configuration for SSE response
      const config = await getMcpServerConfig(serverName);
      
      if (!config) {
        return new Response(
          JSON.stringify({ error: `MCP server '${serverName}' not found` }), 
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Create a streaming response for SSE
      const stream = new ReadableStream({
        start(controller) {
          // Send initial SSE event with server info
          const initialEvent = `data: ${JSON.stringify({
            jsonrpc: '2.0',
            method: 'notifications/initialized',
            params: {
              protocolVersion: '2025-06-18',
              capabilities: {
                tools: {}
              },
              serverInfo: {
                name: config.name,
                version: config.version
              }
            }
          })}\n\n`;
          
          controller.enqueue(new TextEncoder().encode(initialEvent));
          
          // Keep connection alive with heartbeat
          const heartbeat = setInterval(() => {
            try {
              controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
            } catch {
              clearInterval(heartbeat);
            }
          }, 30000);
          
          // Clean up on close
          request.signal.addEventListener('abort', () => {
            clearInterval(heartbeat);
            controller.close();
          });
        }
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
      
    } catch (error) {
      logger.error('Failed to handle SSE request', { 
        serverName,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  
  // Handle POST and other requests with original logic
  try {
    // Extract selected tools from request headers or query params
    let selectedTools: string[] | undefined;
    
    // Try to get selected tools from header (for internal API calls)
    const selectedToolsHeader = request.headers.get('x-mcp-selected-tools');
    if (selectedToolsHeader) {
      try {
        selectedTools = JSON.parse(selectedToolsHeader);
      } catch (e) {
        logger.warn('Failed to parse selected tools header', { error: e });
      }
    }
    
    // Fallback to query parameter (for testing)
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
    
    // Get server configuration from registry with tool filtering
    const config = await getMcpServerConfig(serverName, selectedTools);
    
    if (!config) {
      logger.error('MCP server not found', { serverName });
      return new Response(
        JSON.stringify({ error: `MCP server '${serverName}' not found` }), 
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create the handler for this specific server
    const { debugHandler } = createMcpRouteHandler(config);
    
    // Execute the request
    return await debugHandler(request);
    
  } catch (error) {
    logger.error('Failed to handle MCP request', { 
      serverName,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Export the same handler for all HTTP methods
export { createHandler as GET, createHandler as POST, createHandler as DELETE };