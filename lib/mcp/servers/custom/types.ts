/**
 * Custom MCP Server Type Definitions
 */

import { MCPServerStreamableHttp, hostedMcpTool } from '@openai/agents';
import { CustomMcpCredentials } from '@/lib/types/integrations';

export interface CustomMcpServerResult {
  /** MCP server instance for http type */
  server?: MCPServerStreamableHttp;
  /** Hosted MCP tool for hosted type */
  hostedTool?: ReturnType<typeof hostedMcpTool>;
  /** Server type */
  type: 'hosted' | 'streamable-http';
  /** Server name */
  name: string;
}

export interface CustomMcpTestResult {
  success: boolean;
  error?: string;
  tools?: string[];
  message?: string;
}

export interface ServerCreationOptions {
  credentials: CustomMcpCredentials;
  selectedTools?: string[];
}