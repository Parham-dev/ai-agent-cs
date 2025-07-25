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