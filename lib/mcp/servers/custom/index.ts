/**
 * Custom MCP Server Integration
 * Supports all three MCP server types: hosted, streamable-http, and stdio
 */

import { MCPServerStdio, MCPServerStreamableHttp, hostedMcpTool } from '@openai/agents';
import { logger } from '@/lib/utils/logger';
import { CustomMcpCredentials } from '@/lib/types/integrations';

export interface CustomMcpServerResult {
  /** MCP server instance for stdio/http types */
  server?: MCPServerStdio | MCPServerStreamableHttp;
  /** Hosted MCP tool for hosted type */
  hostedTool?: ReturnType<typeof hostedMcpTool>;
  /** Server type */
  type: 'hosted' | 'streamable-http' | 'stdio';
  /** Server name */
  name: string;
}

/**
 * Create a custom MCP server instance based on configuration
 */
export async function createCustomMcpServer(
  credentials: CustomMcpCredentials
): Promise<CustomMcpServerResult | null> {
  try {
    logger.info('Creating custom MCP server', { 
      serverType: credentials.serverType, 
      name: credentials.name 
    });

    switch (credentials.serverType) {
      case 'hosted':
        return createHostedMcpServer(credentials);
        
      case 'streamable-http':
        return await createStreamableHttpMcpServer(credentials);
        
      case 'stdio':
        return await createStdioMcpServer(credentials);
        
      default:
        throw new Error(`Unsupported MCP server type: ${credentials.serverType}`);
    }
  } catch (error) {
    logger.error('Failed to create custom MCP server', {
      serverType: credentials.serverType,
      name: credentials.name
    }, error as Error);
    return null;
  }
}

/**
 * Create hosted MCP server tool
 */
function createHostedMcpServer(credentials: CustomMcpCredentials): CustomMcpServerResult {
  if (!credentials.serverUrl || !credentials.serverLabel) {
    throw new Error('Server URL and label are required for hosted MCP servers');
  }

  const hostedTool = hostedMcpTool({
    serverLabel: credentials.serverLabel,
    serverUrl: credentials.serverUrl,
    requireApproval: credentials.requireApproval || 'never'
  });

  return {
    hostedTool,
    type: 'hosted',
    name: credentials.name
  };
}

/**
 * Create streamable HTTP MCP server
 */
async function createStreamableHttpMcpServer(credentials: CustomMcpCredentials): Promise<CustomMcpServerResult> {
  if (!credentials.httpUrl) {
    throw new Error('HTTP URL is required for streamable HTTP MCP servers');
  }

  // Prepare auth provider based on auth type
  let authProvider: { type: string; token?: string; apiKey?: string; username?: string; password?: string } | undefined = undefined;
  
  if (credentials.authType && credentials.authType !== 'none') {
    switch (credentials.authType) {
      case 'bearer':
        if (!credentials.authToken) {
          throw new Error('Auth token is required for bearer authentication');
        }
        authProvider = {
          type: 'bearer',
          token: credentials.authToken
        };
        break;
        
      case 'api-key':
        if (!credentials.authToken) {
          throw new Error('API key is required for API key authentication');
        }
        authProvider = {
          type: 'api-key',
          apiKey: credentials.authToken
        };
        break;
        
      case 'basic':
        if (!credentials.username || !credentials.password) {
          throw new Error('Username and password are required for basic authentication');
        }
        authProvider = {
          type: 'basic',
          username: credentials.username,
          password: credentials.password
        };
        break;
    }
  }

  const server = new MCPServerStreamableHttp({
    url: credentials.httpUrl,
    name: credentials.name,
    authProvider,
    sessionId: credentials.sessionId,
    cacheToolsList: true
  });

  return {
    server,
    type: 'streamable-http',
    name: credentials.name
  };
}

/**
 * Create stdio MCP server
 */
async function createStdioMcpServer(credentials: CustomMcpCredentials): Promise<CustomMcpServerResult> {
  if (!credentials.command) {
    throw new Error('Command is required for stdio MCP servers');
  }

  // Handle working directory and options
  const options: {
    name: string;
    fullCommand: string;
    cacheToolsList: boolean;
  } = {
    name: credentials.name,
    fullCommand: credentials.command,
    cacheToolsList: true
  };

  // Add environment variables if specified
  if (credentials.environment && Object.keys(credentials.environment).length > 0) {
    // Note: MCPServerStdio might not support custom environment directly
    // This will depend on the OpenAI Agents SDK implementation
    logger.debug('Environment variables specified for stdio server', {
      environment: credentials.environment
    });
  }

  const server = new MCPServerStdio(options);

  return {
    server,
    type: 'stdio',
    name: credentials.name
  };
}

/**
 * Test connection to custom MCP server
 */
export async function testCustomMcpServerConnection(
  credentials: CustomMcpCredentials
): Promise<{ success: boolean; error?: string; tools?: string[]; message?: string }> {
  try {
    const result = await createCustomMcpServer(credentials);
    if (!result) {
      return { success: false, error: 'Failed to create server instance' };
    }

    // For hosted servers, validate URL and test basic connectivity
    if (result.type === 'hosted') {
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
      
      return { 
        success: true, 
        message: `Hosted MCP server configuration valid. Connection test will be performed server-side.` 
      };
    }

    // For streamable HTTP servers, validate configuration and test connection
    if (result.type === 'streamable-http') {
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
    }
    
    // For stdio servers, validate command
    if (result.type === 'stdio') {
      if (!credentials.command || credentials.command.trim() === '') {
        return { success: false, error: 'Command is required for stdio MCP servers' };
      }
      
      // Basic command validation - check if it contains valid command structure
      const command = credentials.command.trim();
      if (!command.includes(' ') && !command.startsWith('npx') && !command.startsWith('node') && !command.startsWith('python')) {
        return { success: false, error: 'Command should be a complete command with arguments (e.g., "npx @modelcontextprotocol/server-filesystem /path")' };
      }
    }

    // For HTTP and stdio servers, attempt actual connection
    if (result.server) {
      try {
        await result.server.connect();
        
        logger.debug('Testing MCP server connection', {
          name: credentials.name,
          type: credentials.serverType
        });
        
        // Connection successful, close it
        await result.server.close();
        return { success: true };
        
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