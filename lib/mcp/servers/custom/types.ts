/**
 * Custom MCP Server Type Definitions
 */

import { MCPServerStdio, MCPServerStreamableHttp, hostedMcpTool } from '@openai/agents';
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