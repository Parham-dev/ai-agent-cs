import { NextRequest, NextResponse } from 'next/server';
import { run, Agent, type Tool } from '@openai/agents';
import { createShopifyTools } from '@/lib/integrations/shopify/tools';
import { agentsService } from '@/lib/database/services/agents.service';
import { Api, withErrorHandling, validateMethod } from '@/lib/api';
import { createApiLogger } from '@/lib/utils/logger';

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
    endpoint: '/api/agents/chat',
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  try {
    const { agentId, message, conversationHistory = [], context = {} }: ChatRequest = await request.json();

    // Update logger with agentId
    logger = createApiLogger({
      endpoint: '/api/agents/chat',
      agentId,
      requestId: crypto.randomUUID(),
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    logger.info('Chat request received', { 
      agentId, 
      messageLength: message.length, 
      conversationHistoryLength: conversationHistory.length 
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
    const agent = await agentsService.getAgentById(agentId);
    
    if (!agent) {
      logger.warn('Agent not found');
      return Api.notFound('Agent', agentId);
    }

    logger.debug('Agent found', { 
      id: agent.id, 
      name: agent.name, 
      isActive: agent.isActive 
    });

    if (!agent.isActive) {
      logger.warn('Attempted to use inactive agent');
      return Api.error('AGENT_NOT_FOUND', 'Agent is not active');
    }

    // Get agent's integrations
    logger.debug('Fetching agent with integrations');
    const agentWithIntegrations = await agentsService.getAgentWithIntegrations(agentId);
    
    if (!agentWithIntegrations) {
      logger.error('Agent with integrations not found after agent was found');
      return Api.notFound('Agent', agentId);
    }

    logger.debug('Agent with integrations found', { 
      integrationsCount: agentWithIntegrations.integrations.length 
    });

    // Build tools based on agent's configured integrations
    const tools: Tool[] = [];
    
    // Add integration-specific tools
    for (const integration of agentWithIntegrations.integrations) {
      if (!integration.isActive) continue;
      
      logger.debug('Processing integration', { 
        integrationId: integration.id,
        type: integration.type, 
        name: integration.name,
        hasCredentials: !!integration.credentials 
      });
      
      switch (integration.type) {
        case 'shopify':
          if (!integration.credentials.storeName || !integration.credentials.accessToken) {
            logger.error('Missing required Shopify credentials', {
              integrationId: integration.id,
              hasStoreName: !!integration.credentials.storeName,
              hasAccessToken: !!integration.credentials.accessToken
            });
            continue; // Skip this integration
          }
          
          // Cast to ShopifyCredentials since we've validated the required fields
          const shopifyCredentials = integration.credentials as { storeName: string; accessToken: string };
          tools.push(...createShopifyTools(shopifyCredentials));
          logger.debug('Added Shopify tools', { 
            integrationId: integration.id,
            storeName: shopifyCredentials.storeName
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

    // Add universal tools based on agent configuration
    // TODO: Add OpenAI hosted tools, MCP tools, custom tools based on agent.tools

    logger.info('Tools configured for agent', { toolsCount: tools.length });

    // Create the OpenAI Agent instance with integration tools
    const agentConfig = agent.agentConfig && typeof agent.agentConfig === 'object' ? agent.agentConfig : {};
    // Remove tools from agentConfig to avoid conflict with our integration tools
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tools: _, ...cleanAgentConfig } = agentConfig;
    
    const openaiAgent = new Agent({
      name: agent.name,
      instructions: agent.instructions,
      model: agent.model,
      tools: tools.length > 0 ? tools : undefined, // Only integration tools
      ...cleanAgentConfig
    });

    // Build conversation context
    const conversationMessages = conversationHistory.length > 0 
      ? conversationHistory.map((msg: Message) => `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}`).join('\n') + '\n'
      : '';
    
    const fullMessage = conversationMessages + `Customer: ${message}`;

    // Run the agent
    logger.debug('Running OpenAI agent');
    const response = await logger.time('agent-execution', async () => {
      return await run(openaiAgent, fullMessage, {
        context: {
          agentId,
          agentName: agent.name,
          organizationId: agent.organizationId,
          integrations: agentWithIntegrations.integrations.map((i) => ({
            id: i.id,
            type: i.type,
            name: i.name
          })),
          ...context
        },
      });
    });

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