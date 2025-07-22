/**
 * Streamable HTTP MCP Server Creator
 */

import { MCPServerStreamableHttp } from '@openai/agents';
import type { CustomMcpCredentials } from '@/lib/types/integrations';
import type { CustomMcpServerResult } from '../types';

/**
 * Create streamable HTTP MCP server
 */
export async function createStreamableHttpMcpServer(
  credentials: CustomMcpCredentials, 
  selectedTools?: string[]
): Promise<CustomMcpServerResult> {
  if (!credentials.httpUrl) {
    throw new Error('HTTP URL is required for streamable HTTP MCP servers');
  }

  // Prepare auth provider based on auth type
  let authProvider: { 
    type: string; 
    token?: string; 
    apiKey?: string; 
    username?: string; 
    password?: string; 
  } | undefined = undefined;
  
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

  console.log('🔧 Creating HTTP MCP server:', {
    httpUrl: credentials.httpUrl,
    authType: credentials.authType,
    selectedToolsIgnored: selectedTools?.length || 0,
    note: 'HTTP MCP servers expose all tools - filtering not supported at server level'
  });

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