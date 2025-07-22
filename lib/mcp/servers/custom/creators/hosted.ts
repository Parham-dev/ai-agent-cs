/**
 * Hosted MCP Server Creator
 */

import { hostedMcpTool } from '@openai/agents';
import type { CustomMcpCredentials } from '@/lib/types/integrations';
import type { CustomMcpServerResult } from '../types';

/**
 * Create hosted MCP server tool
 */
export function createHostedMcpServer(
  credentials: CustomMcpCredentials, 
  selectedTools?: string[]
): CustomMcpServerResult {
  if (!credentials.serverUrl || !credentials.serverLabel) {
    throw new Error('Server URL and label are required for hosted MCP servers');
  }

  console.log('🔧 Creating hosted MCP tool:', {
    serverLabel: credentials.serverLabel,
    serverUrl: credentials.serverUrl,
    selectedToolsIgnored: selectedTools?.length || 0,
    note: 'Hosted tools managed by OpenAI - all tools will be available to agent'
  });

  const hostedTool = hostedMcpTool({
    serverLabel: credentials.serverLabel,
    serverUrl: credentials.serverUrl,
    requireApproval: credentials.requireApproval || 'never'
    // Note: OpenAI hosted tools may not support selectedTools filtering
    // This would need to be implemented at the Agent level if supported
  });

  return {
    hostedTool,
    type: 'hosted',
    name: credentials.name
  };
}