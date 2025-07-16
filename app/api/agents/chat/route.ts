import { NextRequest, NextResponse } from 'next/server';
import { run, Agent } from '@openai/agents';
import { createShopifyTools } from '@/lib/integrations/shopify/tools';
import { agentsService } from '@/lib/database/services/agents.service';
import { Api, withErrorHandling, validateMethod } from '@/lib/api';

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

  try {
    const { agentId, message, conversationHistory = [], context = {} }: ChatRequest = await request.json();

    console.log('Chat request received:', { agentId, message, conversationHistoryLength: conversationHistory.length });

    if (!agentId || !message) {
      console.log('Validation failed:', { agentId: !!agentId, message: !!message });
      return Api.validationError({ 
        agentId: !agentId ? 'Agent ID is required' : undefined,
        message: !message ? 'Message is required' : undefined
      });
    }

    // Get the agent with its integrations from the database
    console.log('Fetching agent by ID:', agentId);
    const agent = await agentsService.getAgentById(agentId);
    
    if (!agent) {
      console.log('Agent not found:', agentId);
      return Api.notFound('Agent', agentId);
    }

    console.log('Agent found:', { id: agent.id, name: agent.name, isActive: agent.isActive });

    if (!agent.isActive) {
      console.log('Agent is not active:', agentId);
      return Api.error('AGENT_NOT_FOUND', 'Agent is not active');
    }

    // Get agent's integrations
    console.log('Fetching agent with integrations:', agentId);
    const agentWithIntegrations = await agentsService.getAgentWithIntegrations(agentId);
    
    if (!agentWithIntegrations) {
      console.log('Agent with integrations not found:', agentId);
      return Api.notFound('Agent', agentId);
    }

    console.log('Agent with integrations found:', { 
      id: agentWithIntegrations.id, 
      integrationsCount: agentWithIntegrations.integrations.length 
    });

    // Build tools based on agent's configured integrations
    const tools = [];
    
    // Add integration-specific tools
    for (const integration of agentWithIntegrations.integrations) {
      if (!integration.isActive) continue;
      
      console.log('Processing integration:', { 
        id: integration.id, 
        type: integration.type, 
        name: integration.name,
        hasCredentials: !!integration.credentials 
      });
      
      switch (integration.type) {
        case 'shopify':
          console.log('Shopify integration credentials:', integration.credentials);
          
          // Map credentials to expected format
          const shopifyCredentials = {
            storeName: integration.credentials.shopUrl || integration.credentials.storeName || integration.credentials.storeDomain,
            accessToken: integration.credentials.accessToken
          };
          
          console.log('Mapped Shopify credentials:', { 
            storeName: shopifyCredentials.storeName, 
            hasAccessToken: !!shopifyCredentials.accessToken 
          });
          
          if (!shopifyCredentials.storeName) {
            console.error('Missing storeName in Shopify credentials:', integration.credentials);
            continue; // Skip this integration
          }
          
          tools.push(...createShopifyTools(shopifyCredentials));
          break;
        // Future integrations will be added here
        default:
          console.warn(`Unknown integration type: ${integration.type}`);
      }
    }

    // Add universal tools based on agent configuration
    // TODO: Add OpenAI hosted tools, MCP tools, custom tools based on agent.tools

    // For now, allow chat even without tools for testing
    console.log('Tools configured:', tools.length);

    // Create the OpenAI Agent instance
    const openaiAgent = new Agent({
      name: agent.name,
      instructions: agent.instructions,
      model: agent.model,
      tools: tools.length > 0 ? tools : undefined, // Only add tools if we have them
      // Apply any agent-specific configuration from agentConfig JSON field
      ...(agent.agentConfig && typeof agent.agentConfig === 'object' ? agent.agentConfig : {})
    });

    // Build conversation context
    const conversationMessages = conversationHistory.length > 0 
      ? conversationHistory.map((msg: Message) => `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}`).join('\n') + '\n'
      : '';
    
    const fullMessage = conversationMessages + `Customer: ${message}`;

    // Run the agent
    const response = await run(openaiAgent, fullMessage, {
      context: {
        agentId,
        agentName: agent.name,
        organizationId: agent.organizationId,
        integrations: agentWithIntegrations.integrations.map((i: any) => ({
          id: i.id,
          type: i.type,
          name: i.name
        })),
        ...context
      },
    });

    return Api.success({
      message: response.finalOutput || 'I apologize, but I encountered an issue processing your request.',
      agentId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    return Api.error(
      'CHAT_ERROR',
      'I apologize, but I encountered an error while processing your request. Please try again.',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}); 