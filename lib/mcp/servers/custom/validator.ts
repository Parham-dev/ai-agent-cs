/**
 * Custom MCP Server Connection Testing and Validation
 */

import { MCPServerStdio, MCPServerStreamableHttp } from '@openai/agents';
import { logger } from '@/lib/utils/logger';
import type { CustomMcpCredentials } from '@/lib/types/integrations';
import type { CustomMcpTestResult } from './types';
import { createCustomMcpServer } from './factory';

/**
 * Test connection to custom MCP server
 */
export async function testCustomMcpServerConnection(
  credentials: CustomMcpCredentials
): Promise<CustomMcpTestResult> {
  try {
    const result = await createCustomMcpServer(credentials);
    if (!result) {
      return { success: false, error: 'Failed to create server instance' };
    }

    // For hosted servers, validate URL and test basic connectivity
    if (result.type === 'hosted') {
      return await testHostedServer(credentials);
    }
    
    // For HTTP and stdio servers, attempt actual connection
    if (result.server) {
      return await testServerConnection({
        server: result.server,
        type: result.type,
        name: result.name
      }, credentials);
    }

    return { success: false, error: 'Failed to create server instance' };

  } catch (error) {
    logger.error('Custom MCP server connection test failed', {
      serverType: credentials.serverType,
      name: credentials.name
    }, error as Error);
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during connection test'
    };
  }
}

/**
 * Test hosted MCP server
 */
async function testHostedServer(credentials: CustomMcpCredentials): Promise<CustomMcpTestResult> {
  // Basic URL validation
  if (!credentials.serverUrl) {
    return { success: false, error: 'Server URL is required' };
  }
  
  if (!credentials.serverLabel || credentials.serverLabel.trim() === '') {
    return { success: false, error: 'Server label is required' };
  }
  
  let url: URL;
  try {
    url = new URL(credentials.serverUrl);
  } catch {
    return { success: false, error: 'Invalid server URL format' };
  }

  // Validate URL scheme
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { success: false, error: 'Server URL must use HTTP or HTTPS protocol' };
  }

  // For hosted servers, we can't test connectivity from the browser due to CORS
  // The actual connection test happens server-side via the API endpoint
  // This client-side function just does basic validation
  
  // Log information about hosted tools
  console.log('🔧 Hosted MCP Server:', {
    serverUrl: credentials.serverUrl,
    serverLabel: credentials.serverLabel,
    note: 'Hosted tools are discovered dynamically by OpenAI'
  });
  
  return { 
    success: true, 
    tools: ['Hosted tools will be discovered by OpenAI'],
    message: `Hosted MCP server configuration valid. Tools will be discovered when agent connects.` 
  };
}

/**
 * Test server connection for HTTP and stdio servers
 */
async function testServerConnection(
  result: { server: MCPServerStdio | MCPServerStreamableHttp; type: string; name: string },
  credentials: CustomMcpCredentials
): Promise<CustomMcpTestResult> {
  // Validate configuration first
  if (result.type === 'streamable-http') {
    const httpValidation = validateHttpServer(credentials);
    if (!httpValidation.success) return httpValidation;
  }
  
  if (result.type === 'stdio') {
    const stdioValidation = validateStdioServer(credentials);
    if (!stdioValidation.success) return stdioValidation;
  }

  try {
    await result.server.connect();
    
    logger.debug('Testing MCP server connection', {
      name: credentials.name,
      type: credentials.serverType
    });
    
    // Try to discover available tools
    const discoveredTools = await discoverTools(result.server, credentials);
    
    // Connection successful, close it
    await result.server.close();
    
    const actualToolCount = discoveredTools.filter(tool => tool !== 'Tools will be discovered when agent connects').length;
    
    return { 
      success: true,
      tools: discoveredTools,
      message: actualToolCount > 0 
        ? `Connected successfully. ${actualToolCount} tool(s) discovered: ${discoveredTools.slice(0, 3).join(', ')}${discoveredTools.length > 3 ? '...' : ''}.`
        : `Connected successfully. Tools will be discovered when agent connects.`
    };
    
  } catch (connectionError) {
    logger.error('MCP server connection test failed', {
      name: credentials.name,
      type: credentials.serverType
    }, connectionError as Error);
    
    return { 
      success: false, 
      error: `Failed to connect to ${credentials.serverType} server: ${(connectionError as Error).message}`
    };
  }
}

/**
 * Validate HTTP server configuration
 */
function validateHttpServer(credentials: CustomMcpCredentials): CustomMcpTestResult {
  if (!credentials.httpUrl) {
    return { success: false, error: 'HTTP URL is required for streamable HTTP servers' };
  }
  
  // Validate URL format
  try {
    const url = new URL(credentials.httpUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { success: false, error: 'HTTP URL must use HTTP or HTTPS protocol' };
    }
  } catch {
    return { success: false, error: 'Invalid HTTP URL format' };
  }
  
  // Validate auth configuration if specified
  if (credentials.authType && credentials.authType !== 'none') {
    if (credentials.authType === 'bearer' && !credentials.authToken) {
      return { success: false, error: 'Auth token is required for bearer authentication' };
    }
    if (credentials.authType === 'api-key' && !credentials.authToken) {
      return { success: false, error: 'API key is required for API key authentication' };
    }
    if (credentials.authType === 'basic' && (!credentials.username || !credentials.password)) {
      return { success: false, error: 'Username and password are required for basic authentication' };
    }
  }
  
  return { success: true };
}

/**
 * Validate stdio server configuration
 */
function validateStdioServer(credentials: CustomMcpCredentials): CustomMcpTestResult {
  if (!credentials.command || credentials.command.trim() === '') {
    return { success: false, error: 'Command is required for stdio MCP servers' };
  }
  
  // Basic command validation - check if it contains valid command structure
  const command = credentials.command.trim();
  if (!command.includes(' ') && !command.startsWith('npx') && !command.startsWith('node') && !command.startsWith('python')) {
    return { success: false, error: 'Command should be a complete command with arguments (e.g., "npx @modelcontextprotocol/server-filesystem /tmp")' };
  }
  
  // Log command for debugging
  console.log('🔧 Stdio MCP Server command:', {
    command: credentials.command,
    hint: 'Common servers: @modelcontextprotocol/server-filesystem, @modelcontextprotocol/server-sqlite'
  });
  
  return { success: true };
}

/**
 * Discover tools from connected server
 */
async function discoverTools(server: MCPServerStdio | MCPServerStreamableHttp, credentials: CustomMcpCredentials): Promise<string[]> {
  let discoveredTools: string[] = [];
  
  try {
    logger.info('MCP server connected, attempting tool discovery', {
      name: credentials.name,
      type: credentials.serverType,
      serverClass: server.constructor.name
    });
    
    // Log the server object to see what properties are available
    console.log('🔧 MCP Server object:', {
      serverName: credentials.name,
      serverType: credentials.serverType,
      serverKeys: Object.keys(server),
      serverPrototype: Object.getOwnPropertyNames(Object.getPrototypeOf(server))
    });
    
    // Try to call listTools method that we discovered
    if (typeof server.listTools === 'function') {
      try {
        console.log('🔧 Attempting to call listTools()...');
        const tools = await server.listTools();
        console.log('🔧 Tools discovered:', tools);
        
        // Extract tool names from the tools array
        if (Array.isArray(tools)) {
          discoveredTools = tools.map((tool: unknown) => 
            typeof tool === 'object' && tool !== null && 'name' in tool && typeof tool.name === 'string' 
              ? tool.name 
              : String(tool)
          );
          console.log('🔧 Tool names extracted:', discoveredTools);
        } else if (tools && typeof tools === 'object' && tools !== null && 'tools' in tools) {
          const toolsWrapper = tools as { tools: unknown };
          if (Array.isArray(toolsWrapper.tools)) {
            discoveredTools = toolsWrapper.tools.map((tool: unknown) => 
              typeof tool === 'object' && tool !== null && 'name' in tool && typeof tool.name === 'string'
                ? tool.name 
                : String(tool)
            );
            console.log('🔧 Tool names from wrapped object:', discoveredTools);
          }
        }
      } catch (listToolsError) {
        console.log('🔧 listTools() call failed:', listToolsError);
        
        // Try to access cached tools instead
        try {
          const serverWithCache = server as unknown as { _cachedTools?: unknown };
          if (serverWithCache._cachedTools) {
            const cachedTools = serverWithCache._cachedTools;
            console.log('🔧 Accessing cached tools:', cachedTools);
            
            if (Array.isArray(cachedTools)) {
              discoveredTools = cachedTools.map((tool: unknown) => 
                typeof tool === 'object' && tool !== null && 'name' in tool && typeof tool.name === 'string'
                  ? tool.name 
                  : String(tool)
              );
            } else if (cachedTools && typeof cachedTools === 'object' && cachedTools !== null && 'tools' in cachedTools) {
              const toolsWrapper = cachedTools as { tools: unknown };
              if (Array.isArray(toolsWrapper.tools)) {
                discoveredTools = toolsWrapper.tools.map((tool: unknown) => 
                  typeof tool === 'object' && tool !== null && 'name' in tool && typeof tool.name === 'string'
                    ? tool.name 
                    : String(tool)
                );
              }
            }
            
            console.log('🔧 Tool names from cache:', discoveredTools);
          }
        } catch (cacheError) {
          console.log('🔧 Could not access cached tools:', cacheError);
        }
      }
    }
    
    // Fallback if we couldn't get tools
    if (discoveredTools.length === 0) {
      discoveredTools = ['Tools will be discovered when agent connects'];
    }
    
  } catch (toolError) {
    logger.warn('Could not discover tools during connection test', {
      name: credentials.name,
      error: toolError
    });
    discoveredTools = ['Tools will be discovered when agent connects'];
  }
  
  return discoveredTools;
}