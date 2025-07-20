import { NextRequest, NextResponse } from 'next/server';
import { run, Agent, type MCPServerStdio, type AgentInputItem } from '@openai/agents';
import { createMCPClient } from '@/lib/mcp/client';
import { agentsService } from '@/lib/database/services';
import { Api, withErrorHandling, validateMethod } from '@/lib/api';
import { createApiLogger } from '@/lib/utils/logger';
import { verifyWidgetToken, extractBearerToken } from '@/lib/utils/jwt';
import { getAllTools } from '@/lib/tools';
import { getInputGuardrails, getOutputGuardrails } from '@/lib/guardrails';
import { sessionStore } from '@/lib/session/session-store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  agentId: string;
  message: string;
  sessionId?: string;  // Optional - will generate if not provided
  conversationHistory?: Message[];  // Deprecated - ignored in favor of session threads
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
    const { agentId, message, sessionId: requestSessionId, context = {} }: ChatRequest = await request.json();
    
    // Generate session ID if not provided (for new conversations)
    const sessionId = requestSessionId || crypto.randomUUID();

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

    logger.info('Processing chat message', { 
      sessionId,
      agentId, 
      messageLength: message.length,
      isNewSession: !requestSessionId,
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

    // Try to get existing session
    let session = sessionStore.get(sessionId);
    
    if (!session) {
      logger.debug('Creating new session', { sessionId, agentId });
      
      // Get the agent with its integrations from the database
      const agentData = await agentsService.getAgentByIdPublic(agentId);
      
      if (!agentData) {
        logger.warn('Agent not found');
        return Api.notFound('Agent', agentId);
      }

      if (!agentData.isActive) {
        logger.warn('Attempted to use inactive agent');
        return Api.error('AGENT_NOT_FOUND', 'Agent is not active');
      }

      logger.debug('Initializing new session resources for agent', { 
        agentId: agentData.id, 
        agentName: agentData.name,
        isActive: agentData.isActive 
      });

      // Get agent integrations from v2 structure
      const agentIntegrations = agentData.agentIntegrations || [];
      logger.debug('Agent integration configs found', { 
        integrationsCount: agentIntegrations.length 
      });

      // Initialize MCP servers for this session
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

      // Create new session data
      session = {
        sessionId,
        agentId,
        thread: [],  // Start with empty thread following OpenAI pattern
        agent: openaiAgent,
        mcpServers,
        mcpClient,
        lastActivity: new Date(),
        metadata: {
          widgetAuth,
          context,
          agentData: {
            name: agentData.name,
            organizationId: agentData.organizationId,
            integrations: agentIntegrations.map((ai: { integrationId: string; integration?: { type?: string; name?: string } }) => ({
              id: ai.integrationId,
              type: ai.integration?.type || 'unknown',
              name: ai.integration?.name || 'unknown'
            }))
          }
        }
      };

      // Store the new session
      sessionStore.set(sessionId, session);
      
      logger.info('New session created and stored', { 
        sessionId, 
        agentId,
        mcpServersCount: mcpServers.length
      });
      
    } else if (session.agentId !== agentId) {
      logger.warn('Agent mismatch with existing session', { 
        sessionId, 
        sessionAgentId: session.agentId, 
        requestAgentId: agentId 
      });
      return Api.error('VALIDATION_ERROR', 'Session is associated with a different agent');
    } else {
      logger.debug('Using existing session', { 
        sessionId, 
        agentId, 
        threadLength: session.thread.length 
      });
    }

    // Add user message to thread (following OpenAI SDK pattern)
    const currentThread: AgentInputItem[] = session.thread.concat({ 
      role: 'user', 
      content: message 
    });

    // Run agent with existing session data and current thread
    logger.debug('Running OpenAI agent with session', {
      sessionId,
      agentId: session.agentId,
      threadLength: currentThread.length
    });
    
    let response;
    
    try {
      response = await logger.time('agent-execution', async () => {
        return await run(session.agent, currentThread, {
          context: {
            // Required agent context
            agentId: session.agentId,
            ...(session.metadata?.agentData || {}),
            
            // Session context
            sessionId,
            
            // Customer context - varies by scenario
            ...(session.metadata?.widgetAuth 
              ? {
                  // Widget scenario: End customer chatting
                  chatContext: 'widget',
                  endCustomerId: context.endCustomerId || `widget_visitor_${crypto.randomUUID()}`,
                  endCustomerName: context.endCustomerName || context.customerName || 'Website Visitor',
                  endCustomerEmail: context.endCustomerEmail || context.customerEmail || null,
                  sourceUrl: context.sourceUrl || (session.metadata.widgetAuth as { domain?: string })?.domain
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
                  endCustomerEmail: context.endCustomerEmail || context.customerEmail || null
                }
            ),
            
            // Integration context from session
            integrations: (session.metadata?.agentData as { integrations?: unknown[] })?.integrations || [],
            
            // Pass through any additional context
            ...context
          },
        });
      });
      
      // Update session thread with full conversation history (following OpenAI SDK pattern)
      session.thread = response.history;
      session.lastActivity = new Date();
      
      // Update session in store
      sessionStore.set(sessionId, session);
      
      logger.debug('Session thread updated', { 
        sessionId,
        threadLength: session.thread.length 
      });
      
    } catch (agentError) {
      // Handle guardrail errors specifically
      const errorMessage = agentError instanceof Error ? agentError.message : 'Unknown error';
      
      if (errorMessage.includes('Input guardrail triggered')) {
        logger.info('Request blocked by input guardrail - returning user-friendly message');
        return Api.success({
          message: 'I\'m sorry, but I can\'t process that message as it may contain inappropriate content. Please rephrase your message in a respectful way and I\'ll be happy to help.',
          agentId: session.agentId,
          sessionId,
          timestamp: new Date().toISOString(),
          blocked: true,
          reason: 'input_guardrail'
        });
      }
      
      if (errorMessage.includes('Output guardrail triggered')) {
        logger.info('Response blocked by output guardrail - returning user-friendly message');
        return Api.success({
          message: 'I apologize, but I need to revise my response to ensure it meets our quality standards. Please try asking your question again.',
          agentId: session.agentId,
          sessionId,
          timestamp: new Date().toISOString(),
          blocked: true,
          reason: 'output_guardrail'
        });
      }
      
      // Re-throw if it's not a guardrail error
      throw agentError;
    }

    logger.info('Chat request completed successfully', {
      sessionId,
      agentId: session.agentId,
      responseLength: response.finalOutput?.length || 0,
      threadLength: session.thread.length
    });

    return Api.success({
      message: response.finalOutput || 'I apologize, but I encountered an issue processing your request.',
      agentId: session.agentId,
      sessionId,
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