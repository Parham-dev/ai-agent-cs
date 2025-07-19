import { NextRequest, NextResponse } from 'next/server';
import { run, Agent, type MCPServerStdio } from '@openai/agents';
import { createMCPClient } from '@/lib/mcp/client';
import { agentsService } from '@/lib/database/services';
import { Api, withErrorHandling, validateMethod } from '@/lib/api';
import { createApiLogger } from '@/lib/utils/logger';
import { verifyWidgetToken, extractBearerToken } from '@/lib/utils/jwt';
import { getAllTools } from '@/lib/tools';
import { getInputGuardrails, getOutputGuardrails } from '@/lib/guardrails';

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

    // Build MCP servers based on agent's configured integrations
    let mcpClient = null;
    let mcpServers: MCPServerStdio[] = [];
    
    if (agentIntegrations.length > 0) {
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
        logger.error('Failed to initialize MCP client', {}, error as Error);
      }
    }

    // Add universal tools based on agent configuration
    const agentSelectedTools = agentData.tools || []
    const { customTools, openaiTools } = getAllTools(agentSelectedTools);
    
    // Combine all tools - both function tools and hosted tools can be in the same array
    const allTools = [...customTools, ...openaiTools];
    
    logger.info('Universal tools configured', {
      customToolsCount: customTools.length,
      openaiToolsCount: openaiTools.length,
      totalToolsCount: allTools.length,
      selectedTools: agentSelectedTools
    });

    logger.info('MCP servers configured for agent', { 
      mcpServersCount: mcpServers.length
    });

    // Create the OpenAI Agent instance with MCP servers and universal tools
    const agentConfig = agentData.rules && typeof agentData.rules === 'object' ? agentData.rules : {};
    // Remove tools and guardrails from agentConfig to avoid conflict with our separate handling
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tools: _, guardrails: guardrailsConfig, ...cleanAgentConfig } = agentConfig;

    // Configure guardrails if they exist
    const typedGuardrailsConfig = guardrailsConfig as { input?: string[], output?: string[] } | undefined;
    const inputGuardrails = typedGuardrailsConfig?.input ? getInputGuardrails(typedGuardrailsConfig.input) : [];
    const outputGuardrails = typedGuardrailsConfig?.output ? getOutputGuardrails(typedGuardrailsConfig.output) : [];
    
    logger.info('Guardrails configured', {
      inputGuardrailsCount: inputGuardrails.length,
      outputGuardrailsCount: outputGuardrails.length,
      inputGuardrails: typedGuardrailsConfig?.input || [],
      outputGuardrails: typedGuardrailsConfig?.output || []
    });

    const openaiAgent = new Agent({
      name: agentData.name,
      instructions: agentData.systemPrompt || `You are ${agentData.name}, an AI assistant.`,
      model: agentData.model,
      mcpServers: mcpServers.length > 0 ? mcpServers : undefined,
      tools: allTools.length > 0 ? allTools : undefined,
      inputGuardrails: inputGuardrails.length > 0 ? inputGuardrails : undefined,
      outputGuardrails: outputGuardrails.length > 0 ? outputGuardrails : undefined,
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
            // Required agent context
            agentId,
            agentName: agentData.name,
            organizationId: agentData.organizationId,
            
            // Customer context - varies by scenario
            ...(widgetAuth 
              ? {
                  // Widget scenario: End customer chatting
                  chatContext: 'widget',
                  endCustomerId: context.endCustomerId || `widget_visitor_${crypto.randomUUID()}`,
                  endCustomerName: context.endCustomerName || context.customerName || 'Website Visitor',
                  endCustomerEmail: context.endCustomerEmail || context.customerEmail || null,
                  sessionId: context.sessionId || crypto.randomUUID(),
                  sourceUrl: context.sourceUrl || widgetAuth.domain
                }
              : {
                  // Dashboard/Testing scenario: Platform user or anonymous
                  chatContext: context.platformUserId ? 'dashboard' : 'anonymous',
                  platformUserId: context.platformUserId || null,
                  platformUserName: context.platformUserName || null,
                  platformUserEmail: context.platformUserEmail || null,
                  // If platform user wants to test as customer
                  endCustomerId: context.endCustomerId || (context.platformUserId ? `platform_user_${context.platformUserId}` : null),
                  endCustomerName: context.endCustomerName || context.customerName || 'Test User',
                  endCustomerEmail: context.endCustomerEmail || context.customerEmail || null,
                  sessionId: context.sessionId || crypto.randomUUID()
                }
            ),
            
            // Integration context
            integrations: agentIntegrations.map((ai: { integrationId: string; integration?: { type?: string; name?: string } }) => ({
              id: ai.integrationId,
              type: ai.integration?.type || 'unknown',
              name: ai.integration?.name || 'unknown'
            })),
            
            // Pass through any additional context
            ...context
          },
        });
      });
    } catch (agentError) {
      // Handle guardrail errors specifically
      const errorMessage = agentError instanceof Error ? agentError.message : 'Unknown error';
      
      if (errorMessage.includes('Input guardrail triggered')) {
        logger.info('Request blocked by input guardrail - returning user-friendly message');
        return Api.success({
          message: 'I\'m sorry, but I can\'t process that message as it may contain inappropriate content. Please rephrase your message in a respectful way and I\'ll be happy to help.',
          agentId,
          timestamp: new Date().toISOString(),
          blocked: true,
          reason: 'input_guardrail'
        });
      }
      
      if (errorMessage.includes('Output guardrail triggered')) {
        logger.info('Response blocked by output guardrail - returning user-friendly message');
        return Api.success({
          message: 'I apologize, but I need to revise my response to ensure it meets our quality standards. Please try asking your question again.',
          agentId,
          timestamp: new Date().toISOString(),
          blocked: true,
          reason: 'output_guardrail'
        });
      }
      
      // Re-throw if it's not a guardrail error
      throw agentError;
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