import { MCPServerStreamableHttp } from '@openai/agents';
import { logger } from '@/lib/utils/logger';
import { createToolFilterConfig, getSelectedToolsForIntegration } from '@/lib/mcp/config/tool-filter';

/**
 * MCP Server Factory
 * Creates MCP server instances with tool filtering support
 */

export interface ServerFactoryOptions {
  baseUrl: string;
  endpoint: string;
  serverName: string;
  selectedTools?: string[];
  cacheToolsList?: boolean;
  reconnectionOptions?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
  };
}

/**
 * Create an MCP server URL with selected tools
 */
export function createMcpServerUrl(
  baseUrl: string,
  endpoint: string,
  selectedTools?: string[]
): string {
  const url = `${baseUrl}${endpoint}`;
  
  // If we have selected tools, add them as a query parameter
  // This is a fallback - the preferred method is via headers
  if (selectedTools && selectedTools.length > 0) {
    const params = new URLSearchParams();
    params.set('selectedTools', selectedTools.join(','));
    return `${url}?${params.toString()}`;
  }
  
  return url;
}

/**
 * Create MCP server with tool filtering
 */
export function createFilteredMcpServer(options: ServerFactoryOptions): MCPServerStreamableHttp {
  const {
    baseUrl,
    endpoint,
    serverName,
    selectedTools,
    cacheToolsList = true,
    reconnectionOptions
  } = options;

  const serverUrl = createMcpServerUrl(baseUrl, endpoint, selectedTools);

  logger.info('Creating filtered MCP server', {
    serverName,
    serverUrl,
    selectedToolsCount: selectedTools?.length || 0,
    selectedTools
  });

  // Create custom request init to include selected tools header
  const requestInit: RequestInit = selectedTools ? {
    headers: {
      'x-mcp-selected-tools': JSON.stringify(selectedTools)
    }
  } : {};

  return new MCPServerStreamableHttp({
    name: serverName,
    url: serverUrl,
    cacheToolsList,
    requestInit,
    ...(reconnectionOptions && { reconnectionOptions })
  });
}

/**
 * Create multiple MCP servers from integration configurations
 */
export async function createMcpServersFromIntegrations(
  integrations: Array<{
    type: string;
    selectedTools?: string[];
    [key: string]: unknown;
  }>,
  serverConfigs: Array<{
    integrationType: string;
    serverName: string;
    endpoint: string;
  }>,
  baseUrl: string
): Promise<MCPServerStreamableHttp[]> {
  const servers: MCPServerStreamableHttp[] = [];
  const toolFilterConfig = createToolFilterConfig(
    integrations.map(i => ({
      integration: { type: i.type },
      selectedTools: i.selectedTools,
      isEnabled: true
    }))
  );

  for (const config of serverConfigs) {
    const integration = integrations.find(i => i.type === config.integrationType);
    if (!integration) continue;

    const selectedTools = getSelectedToolsForIntegration(
      toolFilterConfig,
      config.integrationType
    );

    if (selectedTools.length === 0) {
      logger.warn('No tools selected for integration, skipping server creation', {
        integrationType: config.integrationType,
        serverName: config.serverName
      });
      continue;
    }

    const server = createFilteredMcpServer({
      baseUrl,
      endpoint: config.endpoint,
      serverName: config.serverName,
      selectedTools,
      cacheToolsList: true,
      ...(process.env.NODE_ENV === 'production' && {
        reconnectionOptions: {
          maxAttempts: 5,
          initialDelay: 1000,
          maxDelay: 10000
        }
      })
    });

    servers.push(server);
  }

  return servers;
}