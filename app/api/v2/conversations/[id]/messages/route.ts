import { NextRequest, NextResponse } from 'next/server';
import { Api, withErrorHandling, validateMethod } from '@/lib/api';
import { createApiLogger } from '@/lib/utils/logger';
import { conversationsService } from '@/lib/database/services/conversations.service';
import { prisma } from '@/lib/database/database';

interface GetMessagesParams {
  params: {
    id: string;
  };
}

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: GetMessagesParams
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const logger = createApiLogger({
    endpoint: '/api/v2/conversations/[id]/messages',
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  try {
    const conversationId = params.id;
    
    logger.info('Fetching messages for conversation', { conversationId });

    if (!conversationId) {
      logger.warn('Conversation ID is required');
      return Api.validationError({ id: 'Conversation ID is required' });
    }

    // Since we don't have authentication context yet, we'll get the conversation
    // first to extract the organization ID from it
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, organizationId: true }
    });

    if (!conversation) {
      logger.warn('Conversation not found', { conversationId });
      return Api.notFound('Conversation', conversationId);
    }

    // Get messages for the conversation
    const messages = await conversationsService.getConversationMessages(
      conversation.organizationId,
      conversationId
    );

    logger.info('Successfully fetched messages', { 
      conversationId,
      messageCount: messages.length 
    });

    return Api.success({
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      }))
    });

  } catch (error) {
    logger.error('Failed to fetch conversation messages', {}, error as Error);
    return Api.error('INTERNAL_ERROR', 'Failed to fetch conversation messages');
  }
});