/**
 * Simplified MCP Integration for OpenAI Agent SDK
 * Direct integration without complex client/factory patterns
 */

import { MCPServerStreamableHttp, hostedMcpTool } from '@openai/agents'
import { logger } from '@/lib/utils/logger'
import { createMCPToken } from '@/lib/mcp/auth/jwt-credentials'
// Create basic auth header using standard Node.js Buffer
function createBasicAuthHeader(username: string, password: string): string {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${credentials}`;
}
import type { CustomMcpCredentials, IntegrationCredentials } from '@/lib/types/integrations'
import type { AgentIntegration, Integration } from '@/lib/types/database'

export interface MCPIntegrationConfig {
  type: string
  name: string
  credentials: IntegrationCredentials | CustomMcpCredentials
  selectedTools: string[]
  config: Record<string, unknown>
}

export interface MCPIntegrationResult {
  servers: MCPServerStreamableHttp[]
  hostedTools: ReturnType<typeof hostedMcpTool>[]
  cleanup: () => Promise<void>
}

/**
 * Create MCP servers and hosted tools from agent integrations
 */
export async function createMCPIntegration(
  integrations: MCPIntegrationConfig[]
): Promise<MCPIntegrationResult> {
  const servers: MCPServerStreamableHttp[] = []
  const hostedTools: ReturnType<typeof hostedMcpTool>[] = []
  
  logger.info('Creating MCP integration', { 
    integrationsCount: integrations.length,
    integrationTypes: integrations.map(i => i.type)
  })

  for (const integration of integrations) {
    try {
      const result = await createIntegrationServer(integration)
      
      if (result.server) {
        // Connect the server before adding it
        await result.server.connect()
        servers.push(result.server)
        
        logger.info('MCP server connected', {
          type: integration.type,
          name: integration.name
        })
      }
      
      if (result.hostedTool) {
        hostedTools.push(result.hostedTool)
      }
      
      logger.info('Integration server created', {
        type: integration.type,
        name: integration.name,
        hasServer: !!result.server,
        hasHostedTool: !!result.hostedTool
      })
      
    } catch (error) {
      logger.error('Failed to create integration server', {
        type: integration.type,
        name: integration.name,
        error: error instanceof Error ? error.message : String(error)
      })
      // Continue with other integrations
    }
  }

  const cleanup = async (): Promise<void> => {
    logger.info('Cleaning up MCP integration', { 
      serversCount: servers.length 
    })
    
    await Promise.allSettled(
      servers.map(server => 
        server.close().catch(error => {
          logger.error('Failed to close MCP server', { error })
        })
      )
    )
  }

  logger.info('MCP integration created', {
    totalIntegrations: integrations.length,
    serversCreated: servers.length,
    hostedToolsCreated: hostedTools.length
  })

  return { servers, hostedTools, cleanup }
}

/**
 * Create a single integration server or hosted tool
 */
async function createIntegrationServer(
  integration: MCPIntegrationConfig
): Promise<{
  server?: MCPServerStreamableHttp
  hostedTool?: ReturnType<typeof hostedMcpTool>
}> {
  // Handle custom MCP servers
  if (integration.type === 'custom-mcp') {
    return createCustomMCPIntegration(integration)
  }

  // Handle built-in integrations (Shopify, Stripe, etc.)
  return createBuiltinIntegration(integration)
}

/**
 * Create custom MCP server integration
 */
function createCustomMCPIntegration(
  integration: MCPIntegrationConfig
): {
  server?: MCPServerStreamableHttp
  hostedTool?: ReturnType<typeof hostedMcpTool>
} {
  const credentials = integration.credentials as CustomMcpCredentials

  if (credentials.serverType === 'hosted' && credentials.serverUrl && credentials.serverLabel) {
    // Use hosted MCP tool for better Vercel compatibility
    const hostedTool = hostedMcpTool({
      serverLabel: credentials.serverLabel,
      serverUrl: credentials.serverUrl,
      // Add approval requirements if specified
      ...(credentials.requireApproval && {
        requireApproval: credentials.requireApproval
      })
    })

    logger.info('Created hosted MCP tool', {
      serverLabel: credentials.serverLabel,
      serverUrl: credentials.serverUrl,
      requireApproval: credentials.requireApproval
    })

    return { hostedTool }
  }

  if (credentials.serverType === 'streamable-http' && credentials.httpUrl) {
    // Create streamable HTTP MCP server
    const requestInit: RequestInit = {}

    // Add authentication headers based on auth type
    if (credentials.authType && credentials.authType !== 'none') {
      const headers: Record<string, string> = {}

      switch (credentials.authType) {
        case 'bearer':
          if (credentials.authToken) {
            headers.Authorization = `Bearer ${credentials.authToken}`
          }
          break
        case 'api-key':
          if (credentials.authToken) {
            headers['X-API-Key'] = credentials.authToken
          }
          break
        case 'basic':
          if (credentials.username && credentials.password) {
            headers.Authorization = createBasicAuthHeader(credentials.username, credentials.password)
          }
          break
      }

      if (Object.keys(headers).length > 0) {
        requestInit.headers = headers
      }
    }

    const server = new MCPServerStreamableHttp({
      name: credentials.name,
      url: credentials.httpUrl,
      cacheToolsList: true,
      requestInit,
      // Add reconnection options for production
      ...(process.env.NODE_ENV === 'production' && {
        reconnectionOptions: {
          maxAttempts: 5,
          initialDelay: 1000,
          maxDelay: 10000
        }
      })
    })

    logger.info('Created streamable HTTP MCP server', {
      name: credentials.name,
      url: credentials.httpUrl,
      authType: credentials.authType,
      hasAuth: credentials.authType !== 'none'
    })

    return { server }
  }

  logger.warn('Custom MCP credentials invalid or incomplete', {
    serverType: credentials.serverType,
    hasServerUrl: !!credentials.serverUrl,
    hasServerLabel: !!credentials.serverLabel,
    hasHttpUrl: !!credentials.httpUrl
  })

  return {}
}

/**
 * Create built-in integration server (Shopify, Stripe, etc.)
 */
function createBuiltinIntegration(
  integration: MCPIntegrationConfig
): {
  server?: MCPServerStreamableHttp
  hostedTool?: ReturnType<typeof hostedMcpTool>
} {
  // Get the base URL for our API
  const baseUrl = getServerBaseUrl()
  const serverUrl = `${baseUrl}/api/mcp/${integration.type}`

  // For production, prefer hosted MCP tools with JWT authentication
  if (process.env.NODE_ENV === 'production') {
    // Create JWT token with organization context and credentials
    const token = createMCPToken(
      integration.config.organizationId as string,
      integration.type,
      integration.credentials
    )

    const hostedTool = hostedMcpTool({
      serverLabel: `${integration.type}-integration`,
      serverUrl: serverUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(integration.selectedTools.length > 0 && {
          'x-mcp-selected-tools': JSON.stringify(integration.selectedTools)
        })
      }
    })

    logger.info('Created hosted MCP tool for production', {
      type: integration.type,
      name: integration.name,
      url: serverUrl,
      selectedToolsCount: integration.selectedTools.length,
      hasToken: !!token
    })

    return { hostedTool }
  }

  // For development, use StreamableHttp
  const requestInit: RequestInit = {
    headers: {
      'x-mcp-integration-type': integration.type,
      'x-mcp-integration-name': integration.name,
      'x-organization-id': integration.config.organizationId as string,
      ...(integration.selectedTools.length > 0 && {
        'x-mcp-selected-tools': JSON.stringify(integration.selectedTools)
      })
    }
  }

  const server = new MCPServerStreamableHttp({
    name: `${integration.type}-mcp-server`,
    url: serverUrl,
    cacheToolsList: true,
    requestInit,
    reconnectionOptions: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000
    }
  })

  logger.info('Created StreamableHttp MCP server for development', {
    type: integration.type,
    name: integration.name,
    url: serverUrl,
    selectedToolsCount: integration.selectedTools.length
  })

  return { server }
}

/**
 * Get server base URL for MCP connections
 */
function getServerBaseUrl(): string {
  // Use environment variables for proper deployment
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL
    // Check if VERCEL_URL already has protocol
    if (vercelUrl.startsWith('http://') || vercelUrl.startsWith('https://')) {
      return vercelUrl
    }
    return `https://${vercelUrl}`
  }
  
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const url = process.env.NEXT_PUBLIC_SITE_URL
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
  }
  
  // Development fallback
  return 'http://localhost:3000'
}

/**
 * Transform agent integrations to MCP integration configs
 */
export function transformAgentIntegrationsToMCP(
  agentIntegrations: (AgentIntegration & {
    integration: Pick<Integration, 'id' | 'name' | 'type' | 'isActive' | 'credentials'>
  })[]
): MCPIntegrationConfig[] {
  return agentIntegrations
    .filter(ai => ai.isEnabled && ai.integration?.isActive)
    .map(ai => ({
      type: ai.integration.type,
      name: ai.integration.name,
      credentials: ai.integration.credentials as IntegrationCredentials | CustomMcpCredentials,
      selectedTools: ai.selectedTools || [],
      config: (ai.config as Record<string, unknown>) || {}
    }))
}