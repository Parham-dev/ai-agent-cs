import { NextRequest, NextResponse } from 'next/server';
import { run, Agent, type Tool, type MCPServerStdio } from '@openai/agents';
import { createShopifyTools } from '@/lib/integrations/shopify/tools';
import { createMCPClient } from '@/lib/mcp/client';
import { agentsService } from '@/lib/database/services';
import { Api, withErrorHandling, validateMethod } from '@/lib/api';
import { createApiLogger } from '@/lib/utils/logger';
import { verifyWidgetToken, extractBearerToken } from '@/lib/utils/jwt';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  agentId: string;
  message: string;
  conversationHistory?: Message[];
  context?: Record<string, unknown>;
}

export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  // Create initial logger
  let logger = createApiLogger({
    endpoint: '/api/v2/agents/chat',
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  try {
    const { agentId, message, conversationHistory = [], context = {} }: ChatRequest = await request.json();

    // Check for widget authentication token
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    let widgetAuth = null;
    
    if (token) {
      widgetAuth = verifyWidgetToken(token);
      if (widgetAuth && widgetAuth.agentId !== agentId) {
        logger.warn('Token agent ID mismatch', {
          tokenAgentId: widgetAuth.agentId,
          requestAgentId: agentId
        });
        return Api.error('VALIDATION_ERROR', 'Token agent ID does not match request');
      }
    }

    // Update logger with agentId and auth context
    logger = createApiLogger({
      endpoint: '/api/v2/agents/chat',
      agentId,
      requestId: crypto.randomUUID(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      isWidget: !!widgetAuth,
      domain: widgetAuth?.domain
    });

    logger.info('Chat request received', { 
      agentId, 
      messageLength: message.length, 
      conversationHistoryLength: conversationHistory.length,
      isWidgetRequest: !!widgetAuth
    });

    if (!agentId || !message) {
      logger.warn('Chat request validation failed', { 
        hasAgentId: !!agentId, 
        hasMessage: !!message 
      });
      return Api.validationError({ 
        agentId: !agentId ? 'Agent ID is required' : undefined,
        message: !message ? 'Message is required' : undefined
      });
    }

    // Get the agent with its integrations from the database
    logger.debug('Fetching agent by ID');
    const agentData = await agentsService.getAgentById(agentId);
    
    if (!agentData) {
      logger.warn('Agent not found');
      return Api.notFound('Agent', agentId);
    }

    logger.debug('Agent found', { 
      id: agentData.id, 
      name: agentData.name, 
      isActive: agentData.isActive 
    });

    if (!agentData.isActive) {
      logger.warn('Attempted to use inactive agent');
      return Api.error('AGENT_NOT_FOUND', 'Agent is not active');
    }

    // Get agent integrations from v2 structure
    const agentIntegrations = agentData.agentIntegrations || [];
    logger.debug('Agent integration configs found', { 
      integrationsCount: agentIntegrations.length 
    });

    // Build tools based on agent's configured integrations
    const tools: Tool[] = [];
    let mcpClient = null;
    let mcpServers: MCPServerStdio[] = [];
    
    // Check if we should use MCP (feature flag or environment variable)
    const useMCP = process.env.ENABLE_MCP === 'true';
    
    if (useMCP && agentIntegrations.length > 0) {
      // Use MCP servers for integrations
      logger.debug('Using MCP servers for integrations');
      
      try {
        // Prepare integrations for MCP client - integrations are already loaded in v2
        const mcpIntegrations = [];
        
        for (const agentIntegration of agentIntegrations) {
          if (agentIntegration.integration && agentIntegration.integration.isActive) {
            mcpIntegrations.push({
              type: agentIntegration.integration.type,
              credentials: agentIntegration.integration.credentials,
              // settings removed in V2 - tools are now dynamic from MCP servers
            });
          }
        }
        
        // Initialize MCP client
        const mcpClientResult = await createMCPClient(mcpIntegrations);
        mcpClient = mcpClientResult.client;
        mcpServers = mcpClientResult.servers;
        
        logger.info('MCP client initialized', { 
          serverCount: mcpServers.length,
          integrationTypes: mcpIntegrations.map(i => i.type)
        });
      } catch (error) {
        logger.error('Failed to initialize MCP client, falling back to legacy tools', {}, error as Error);
      }
    }
    
    // Fallback to legacy context-passing tools if MCP is not available
    if (!useMCP || mcpServers.length === 0) {
      logger.debug('Using legacy context-passing tools');
      
      // Add integration-specific tools (legacy approach)
      for (const agentIntegration of agentIntegrations) {
        const integration = agentIntegration.integration;
        if (!integration || !integration.isActive) continue;
        
        logger.debug('Processing integration', { 
          integrationId: integration.id,
          type: integration.type, 
          name: integration.name,
          hasCredentials: !!integration.credentials 
        });
        
        switch (integration.type) {
          case 'shopify':
            if (!integration.credentials.shopUrl || !integration.credentials.accessToken) {
              logger.error('Missing required Shopify credentials', {
                integrationId: integration.id,
                hasShopUrl: !!integration.credentials.shopUrl,
                hasAccessToken: !!integration.credentials.accessToken
              });
              continue; // Skip this integration
            }
            
            // Convert shopUrl to storeName for legacy tools and cast to ShopifyCredentials
            const shopifyCredentials = {
              storeName: integration.credentials.shopUrl as string,
              accessToken: integration.credentials.accessToken as string
            };
            tools.push(...createShopifyTools(shopifyCredentials));
            logger.debug('Added Shopify tools', { 
              integrationId: integration.id,
              shopUrl: integration.credentials.shopUrl
            });
            break;
          // Future integrations will be added here
          default:
            logger.warn('Unknown integration type', { 
              type: integration.type,
              integrationId: integration.id
            });
        }
      }
    }

    // Add universal tools based on agent configuration
    // TODO: Add OpenAI hosted tools, custom tools based on agent.tools

    logger.info('Tools configured for agent', { 
      toolsCount: tools.length,
      mcpServersCount: mcpServers.length,
      useMCP 
    });

    // Create the OpenAI Agent instance with integration tools
    const agentConfig = agentData.rules && typeof agentData.rules === 'object' ? agentData.rules : {};
    // Remove tools from agentConfig to avoid conflict with our integration tools
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tools: _, ...cleanAgentConfig } = agentConfig;
    
    const openaiAgent = new Agent({
      name: agentData.name,
      instructions: agentData.systemPrompt || `You are ${agentData.name}, an AI assistant.`,
      model: agentData.model,
      tools: tools.length > 0 ? tools : undefined, // Legacy context-passing tools
      mcpServers: mcpServers.length > 0 ? mcpServers : undefined, // MCP servers
      ...cleanAgentConfig
    });

    // Build conversation context
    const conversationMessages = conversationHistory.length > 0 
      ? conversationHistory.map((msg: Message) => `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}`).join('\n') + '\n'
      : '';
    
    const fullMessage = conversationMessages + `Customer: ${message}`;

    // Run the agent
    logger.debug('Running OpenAI agent');
    let response;
    
    try {
      response = await logger.time('agent-execution', async () => {
        return await run(openaiAgent, fullMessage, {
          context: {
            agentId,
            agentName: agentData.name,
            organizationId: agentData.organizationId,
            integrations: agentIntegrations.map((ai: { integrationId: string; integration?: { type?: string; name?: string } }) => ({
              id: ai.integrationId,
              type: ai.integration?.type || 'unknown',
              name: ai.integration?.name || 'unknown'
            })),
            ...context
          },
        });
      });
    } finally {
      // Clean up MCP client connections
      if (mcpClient) {
        try {
          await mcpClient.closeAll();
          logger.debug('MCP client connections closed');
        } catch (cleanupError) {
          logger.error('Failed to close MCP client connections', {}, cleanupError as Error);
        }
      }
    }

    logger.info('Chat request completed successfully', {
      responseLength: response.finalOutput?.length || 0
    });

    return Api.success({
      message: response.finalOutput || 'I apologize, but I encountered an issue processing your request.',
      agentId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Chat request failed', {}, error as Error);
    
    return Api.error(
      'CHAT_ERROR',
      'I apologize, but I encountered an error while processing your request. Please try again.',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}); 