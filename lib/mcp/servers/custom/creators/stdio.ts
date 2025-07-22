/**
 * Stdio MCP Server Creator
 */

import { MCPServerStdio } from '@openai/agents';
import { logger } from '@/lib/utils/logger';
import type { CustomMcpCredentials } from '@/lib/types/integrations';
import type { CustomMcpServerResult } from '../types';

/**
 * Create stdio MCP server
 */
export async function createStdioMcpServer(
  credentials: CustomMcpCredentials, 
  selectedTools?: string[]
): Promise<CustomMcpServerResult> {
  if (!credentials.command) {
    throw new Error('Command is required for stdio MCP servers');
  }

  // Handle working directory and options
  console.log('🔧 Creating stdio MCP server:', {
    command: credentials.command,
    selectedToolsIgnored: selectedTools?.length || 0,
    note: 'Third-party MCP servers expose all tools - filtering not supported at server level'
  });
  
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