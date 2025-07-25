import { NextRequest, NextResponse } from 'next/server';
import { run, type AgentInputItem } from '@openai/agents';
import { InputGuardrailTripwireTriggered, OutputGuardrailTripwireTriggered } from '@openai/agents-core';
import { agentsService } from '@/lib/database/services';
import { Api, withErrorHandling, validateMethod } from '@/lib/api';
import { createApiLogger } from '@/lib/utils/logger';
import { verifyWidgetToken, extractBearerToken } from '@/lib/utils/jwt';
import { sessionStore } from '@/lib/session/database-session-store';
import { createAgent } from '@/lib/agents/agent-factory';
import { conversationsService } from '@/lib/database/services/conversations.service';
import { getGlobalTraceProvider, runInContext } from '@/lib/services/openai-initialization.service';
import { checkOrganizationCredits, estimateMessageTokens } from '@/lib/auth/credit-check';
import { organizationCreditsService } from '@/lib/database/services/organization-credits.service';

// Use Node.js runtime for full feature support
export const runtime = 'nodejs';

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
    const requestBody = await request.json();
    logger.info('🔍 Raw request body received:', { requestBody });
    
    const { agentId, message, sessionId: requestSessionId, context = {} }: ChatRequest = requestBody;
    
    // Generate session ID if not provided (for new conversations)
    const sessionId = requestSessionId || crypto.randomUUID();
    
    logger.info('🔍 Parsed request data:', { 
      agentId, 
      message, 
      sessionId, 
      context,
      hasSessionId: !!requestSessionId 
    });

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

    // Get agent data first for validation
    const agentData = await agentsService.getAgentByIdPublic(agentId);
    
    if (!agentData) {
      logger.warn('Agent not found');
      return Api.notFound('Agent', agentId);
    }

    if (!agentData.isActive) {
      logger.warn('Attempted to use inactive agent');
      return Api.error('VALIDATION_ERROR', 'Agent is not active');
    }

    // Check organization credits before processing
    logger.info('Checking organization credits', { 
      organizationId: agentData.organizationId,
      model: agentData.model
    });

    // Initialize credits if needed (for new organizations)
    try {
      const credits = await organizationCreditsService.getOrganizationCredits(agentData.organizationId);
      if (!credits) {
        logger.info('Initializing credits for new organization');
        await organizationCreditsService.initializeOrganizationCredits(agentData.organizationId);
      }
    } catch (error) {
      logger.error('Failed to initialize credits', {}, error as Error);
    }

    const estimatedTokens = estimateMessageTokens(message);
    const creditCheck = await checkOrganizationCredits(agentData.organizationId, {
      estimatedTokens,
      model: agentData.model,
      errorMessage: 'Your organization has insufficient credits to process this request. Please add credits to continue.'
    });

    if (!creditCheck.hasCredits) {
      logger.warn('Insufficient credits', {
        organizationId: agentData.organizationId,
        currentBalance: creditCheck.currentBalance,
        estimatedCost: creditCheck.estimatedCost
      });
      
      return Api.error('VALIDATION_ERROR', creditCheck.message || 'Insufficient credits', {
        currentBalance: creditCheck.currentBalance,
        estimatedCost: creditCheck.estimatedCost,
        requiredCredits: creditCheck.estimatedCost,
        addCreditsUrl: '/api/v2/organization/credits'
      });
    }

    logger.info('Credit check passed', {
      currentBalance: creditCheck.currentBalance,
      estimatedCost: creditCheck.estimatedCost
    });

    // Try to get existing session
    let session = await sessionStore.get(sessionId, agentData.organizationId);
    
    if (!session) {
      logger.debug('Creating new session', { sessionId, agentId });
      
      // Create conversation using service
      const conversation = await conversationsService.createConversation(
        agentData.organizationId,
        {
          agentId,
          sessionId,
        }
      );
      
      // Create Agent using factory
      const { agent, cleanup } = await createAgent(agentData);

      session = {
        sessionId,
        agentId,
        organizationId: agentData.organizationId,
        conversationId: conversation.id, // Use the created conversation ID
        thread: [],
        agent,
        cleanup,
        lastActivity: new Date(),
        metadata: {
          widgetAuth,
          context,
          agentData: {
            name: agentData.name,
            organizationId: agentData.organizationId
          }
        }
      };

      // Store session
      await sessionStore.set(sessionId, session);
      logger.info('New session created', { sessionId, agentId, conversationId: conversation.id });
      
    } else if (session.agentId !== agentId) {
      logger.warn('Agent mismatch with existing session');
      return Api.error('VALIDATION_ERROR', 'Session is associated with a different agent');
    } else {
      logger.debug('Using existing session', { sessionId, agentId, threadLength: session.thread.length });
    }

    // Add user message to thread (following OpenAI SDK pattern)
    const currentThread: AgentInputItem[] = session.thread.concat({ 
      role: 'user', 
      content: message 
    });

    // Run agent
    logger.info('🚀 Running agent', { sessionId, agentId, threadLength: currentThread.length });
    logger.info('🚀 Current thread before agent run:', { currentThread });
    
    let response;
    
    try {

      // Run agent execution within request-scoped context for cost tracking
      response = await runInContext(
        {
          organizationId: session.organizationId,
          agentId: session.agentId,
          conversationId: session.conversationId,
        },
        async () => {
          return await logger.time('agent-execution', async () => {
            return await run(session.agent, currentThread, {
              context: {
                agentId: session.agentId,
                organizationId: session.organizationId,
                sessionId,
                ...(session.metadata || {}),
                ...context
              },
            });
          });
        }
      );
      
      logger.info('🚀 Agent execution completed:', { 
        finalOutput: response.finalOutput,
        historyLength: response.history?.length || 0,
        responseKeys: Object.keys(response)
      });
      
      // Update session thread with full conversation history
      session.thread = response.history;
      session.lastActivity = new Date();
      
      // Persist messages to database if we have content
      if (session.conversationId && response.finalOutput) {
        // Add user message
        await conversationsService.createMessage(session.organizationId, {
          conversationId: session.conversationId,
          role: 'USER',
          content: message
        });

        // Add assistant response
        await conversationsService.createMessage(session.organizationId, {
          conversationId: session.conversationId,
          role: 'ASSISTANT',
          content: response.finalOutput
        });

        // Generate conversation title from first user message if not set
        const conversation = await conversationsService.getConversationById(
          session.organizationId,
          session.conversationId
        );
        
        if (conversation && !conversation.title) {
          // Generate title from first user message (first 50 chars)
          let title = message.slice(0, 50);
          if (message.length > 50) {
            title += '...';
          }
          
          await conversationsService.updateConversation(
            session.organizationId,
            session.conversationId,
            { title }
          );
          
          logger.debug('Generated conversation title', { 
            conversationId: session.conversationId, 
            title 
          });
        }
      }

      // Update session in store
      await sessionStore.set(sessionId, session);
      
      logger.debug('Session updated', { sessionId, threadLength: session.thread.length });
      
    } catch (agentError) {
      logger.error('Agent execution failed', { sessionId, agentId }, agentError as Error);
      
      // Handle specific guardrail errors with user-friendly messages
      if (agentError instanceof InputGuardrailTripwireTriggered) {
        return Api.error('GUARDRAIL_BLOCKED', 
          'Your message was blocked by our safety filters. Please try rephrasing your request.',
          { 
            guardrailType: 'input',
            reason: 'Content safety check failed'
          }
        );
      }
      
      if (agentError instanceof OutputGuardrailTripwireTriggered) {
        return Api.error('RESPONSE_BLOCKED', 
          'The response was filtered for quality and safety. Please try your request again.',
          { 
            guardrailType: 'output',
            reason: 'Response quality check failed'
          }
        );
      }
      
      // Handle generic errors
      return Api.error('INTERNAL_ERROR', 'An error occurred while processing your request. Please try again.');
    }

    // Return successful response
    const finalResponse = {
      sessionId,
      message: response.finalOutput || 'I apologize, but I encountered an issue processing your request.',
      agentId: session.agentId,
      timestamp: new Date().toISOString(),
      conversationId: session.conversationId
    };
    
    logger.info('🎯 Final API response being returned:', { 
      finalResponse,
      responseLength: response.finalOutput?.length || 0,
      threadLength: session.thread.length
    });

    // Force flush traces to ensure cost tracking is captured
    try {
      await getGlobalTraceProvider().forceFlush();
    } catch (flushError) {
      logger.error('Failed to flush traces', {}, flushError as Error);
      // Don't fail the request if trace flushing fails
    }

    const apiResult = Api.success(finalResponse);
    
    logger.info('🎯 Full API result structure:', { 
      apiResult,
      status: apiResult.status,
      headers: Object.fromEntries(apiResult.headers?.entries() || [])
    });
    
    return apiResult;

  } catch (error) {
    logger.error('Chat request failed', {}, error as Error);
    return Api.error('INTERNAL_ERROR', 'Internal server error occurred');
  }
});