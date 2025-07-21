import { NextRequest, NextResponse } from 'next/server';
import { conversationsService } from '@/lib/database/services/conversations.service';
import { agentsService } from '@/lib/database/services';
import { Api, withErrorHandling, validateMethod } from '@/lib/api';
import { createApiLogger } from '@/lib/utils/logger';

export const GET = withErrorHandling(async (request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const logger = createApiLogger({
    endpoint: '/api/v2/agents/[id]/conversations',
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  try {
    const params = await context.params;
    const agentId = params.id;
    
    if (!agentId) {
      return Api.error('VALIDATION_ERROR', 'Agent ID is required');
    }

    // Get agent to verify it exists and get organization ID
    const agent = await agentsService.getAgentByIdPublic(agentId);
    
    if (!agent) {
      logger.warn('Agent not found');
      return Api.notFound('Agent', agentId);
    }

    // Get conversations for this agent
    const conversations = await conversationsService.getConversations(agent.organizationId, {
      agentId,
      limit: 50, // Limit to recent conversations
    });

    // Transform conversations to thread list format
    const threads = conversations.map(conversation => ({
      status: conversation.isArchived ? 'archived' : 'regular',
      remoteId: conversation.id, // Use unique conversation ID instead of potentially duplicate sessionId
      externalId: conversation.id,
      sessionId: conversation.sessionId, // Keep sessionId as separate field if needed
      title: conversation.title || 'Untitled Chat',
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt
    }));

    logger.info('Conversations fetched for agent', {
      agentId,
      conversationCount: conversations.length
    });

    return Api.success({
      threads: threads.sort((a, b) => 
        new Date(b.lastMessageAt || b.createdAt).getTime() - 
        new Date(a.lastMessageAt || a.createdAt).getTime()
      )
    });

  } catch (error) {
    logger.error('Failed to fetch conversations', {}, error as Error);
    return Api.error('INTERNAL_ERROR', 'Failed to fetch conversations');
  }
});