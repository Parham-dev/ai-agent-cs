/**
 * Custom MCP Server Factory
 * Main entry point for creating Custom MCP servers
 */

import { logger } from '@/lib/utils/logger';
import type { CustomMcpCredentials } from '@/lib/types/integrations';
import type { CustomMcpServerResult } from './types';
import { 
  createHostedMcpServer, 
  createStreamableHttpMcpServer, 
  createStdioMcpServer 
} from './creators';

/**
 * Create a custom MCP server instance based on configuration
 * Note: selectedTools parameter is maintained for compatibility but not used
 * as Custom MCP servers expose all tools due to OpenAI SDK limitations
 */
export async function createCustomMcpServer(
  credentials: CustomMcpCredentials,
  selectedTools?: string[]
): Promise<CustomMcpServerResult | null> {
  try {
    logger.info('Creating custom MCP server', { 
      serverType: credentials.serverType, 
      name: credentials.name,
      note: 'selectedTools ignored - Custom MCP servers expose all tools'
    });
    
    console.log('🔧 Custom MCP server creation:', {
      serverType: credentials.serverType,
      name: credentials.name,
      selectedToolsIgnored: selectedTools?.length || 0,
      reason: 'OpenAI SDK limitation - all tools will be available'
    });

    switch (credentials.serverType) {
      case 'hosted':
        return createHostedMcpServer(credentials, selectedTools);
        
      case 'streamable-http':
        return await createStreamableHttpMcpServer(credentials, selectedTools);
        
      case 'stdio':
        return await createStdioMcpServer(credentials, selectedTools);
        
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