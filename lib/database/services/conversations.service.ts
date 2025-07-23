import { prisma } from '@/lib/database/database'
import {
  type Conversation,
  type ConversationWithRelations,
  type Message,
  type MessageWithRelations,
  type CreateConversationData,
  type UpdateConversationData,
  type CreateMessageData,
  type UpdateMessageData,
  type ConversationFilters,
  type MessageFilters,
  type SessionFilters,
  type SessionSummary,
  type ConversationStats
} from '@/lib/types/database'
import { 
  DatabaseError, 
  NotFoundError, 
  ValidationError 
} from '@/lib/utils/errors'

class ConversationsService {
  // =====================================
  // CONVERSATION MANAGEMENT
  // =====================================

  async getConversations(
    organizationId: string, 
    filters: ConversationFilters = {}
  ): Promise<ConversationWithRelations[]> {
    try {
      const {
        agentId,
        sessionId,
        customerId,
        status,
        isArchived,
        search,
        dateFrom,
        dateTo,
        limit = 20,
        offset = 0
      } = filters

      const where: Record<string, unknown> = {
        organizationId
      }

      if (agentId) where.agentId = agentId
      if (sessionId) where.sessionId = sessionId
      if (customerId) where.customerId = customerId
      if (status) where.status = status
      if (isArchived !== undefined) where.isArchived = isArchived

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo })
        }
      }

      return await prisma.conversation.findMany({
        where,
        include: {
          organization: {
            select: { name: true, slug: true }
          },
          agent: {
            select: { id: true, name: true, model: true }
          },
          messages: {
            select: { 
              id: true, 
              conversationId: true,
              role: true, 
              content: true, 
              tokenCount: true,
              finishReason: true,
              toolCalls: true,
              toolResults: true,
              usageRecordId: true,
              createdAt: true 
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          usageRecords: {
            select: { id: true, totalCost: true, totalTokens: true }
          },
          _count: {
            select: { messages: true, usageRecords: true }
          }
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
        skip: offset
      })
    } catch (error) {
      throw new DatabaseError('Failed to get conversations (V2)', error as Error)
    }
  }

  async getConversationById(
    organizationId: string, 
    conversationId: string
  ): Promise<ConversationWithRelations | null> {
    try {
      return await prisma.conversation.findFirst({
        where: { 
          id: conversationId, 
          organizationId 
        },
        include: {
          organization: {
            select: { name: true, slug: true }
          },
          agent: {
            select: { id: true, name: true, model: true }
          },
          messages: {
            orderBy: { createdAt: 'asc' }
          },
          usageRecords: {
            select: { id: true, totalCost: true, totalTokens: true }
          },
          _count: {
            select: { messages: true, usageRecords: true }
          }
        }
      })
    } catch (error) {
      throw new DatabaseError('Failed to get conversation by ID (V2)', error as Error)
    }
  }

  async getConversationByIdOrThrow(
    organizationId: string, 
    conversationId: string
  ): Promise<ConversationWithRelations> {
    const conversation = await this.getConversationById(organizationId, conversationId)
    if (!conversation) {
      throw new NotFoundError(`Conversation ${conversationId} not found`)
    }
    return conversation
  }

  async createConversation(
    organizationId: string,
    data: CreateConversationData
  ): Promise<Conversation> {
    try {
      if (!data.agentId?.trim()) {
        throw new ValidationError('Agent ID is required')
      }

      if (!data.sessionId?.trim()) {
        throw new ValidationError('Session ID is required')
      }

      // Verify agent exists and belongs to organization
      const agent = await prisma.agent.findFirst({
        where: { id: data.agentId, organizationId }
      })

      if (!agent) {
        throw new NotFoundError(`Agent ${data.agentId} not found`)
      }

      return await prisma.conversation.create({ 
        data: {
          organizationId,
          agentId: data.agentId,
          sessionId: data.sessionId,
          status: 'ACTIVE',
          channel: data.channel?.trim() || 'web',
          isArchived: false,
          customerId: data.customerId?.trim() || null,
          customerName: data.customerName?.trim() || null,
          customerEmail: data.customerEmail?.trim() || null,
          title: data.title?.trim() || null,
          context: data.context
        }
      })
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError('Failed to create conversation (V2)', error as Error)
    }
  }

  async updateConversation(
    organizationId: string,
    conversationId: string,
    data: UpdateConversationData
  ): Promise<Conversation> {
    try {
      // Verify conversation exists and belongs to organization
      await this.getConversationByIdOrThrow(organizationId, conversationId)

      const updateData: Record<string, unknown> = {}

      if (data.title !== undefined) updateData.title = data.title?.trim() || null
      if (data.status !== undefined) updateData.status = data.status
      if (data.isArchived !== undefined) updateData.isArchived = data.isArchived
      if (data.context !== undefined) updateData.context = data.context
      if (data.customerId !== undefined) updateData.customerId = data.customerId?.trim() || null
      if (data.customerName !== undefined) updateData.customerName = data.customerName?.trim() || null
      if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail?.trim() || null
      if (data.lastMessageAt !== undefined) updateData.lastMessageAt = data.lastMessageAt

      return await prisma.conversation.update({
        where: { id: conversationId },
        data: updateData
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError('Failed to update conversation (V2)', error as Error)
    }
  }

  async deleteConversation(
    organizationId: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Verify conversation exists and belongs to organization
      await this.getConversationByIdOrThrow(organizationId, conversationId)

      await prisma.conversation.delete({
        where: { id: conversationId }
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError('Failed to delete conversation (V2)', error as Error)
    }
  }

  // =====================================
  // MESSAGE MANAGEMENT
  // =====================================

  async getMessages(
    organizationId: string,
    filters: MessageFilters = {}
  ): Promise<MessageWithRelations[]> {
    try {
      const {
        conversationId,
        role,
        search,
        dateFrom,
        dateTo,
        limit = 50,
        offset = 0
      } = filters

      const where: Record<string, unknown> = {
        conversation: { organizationId }
      }

      if (conversationId) where.conversationId = conversationId
      if (role) where.role = role

      if (search) {
        where.content = { contains: search, mode: 'insensitive' }
      }

      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo })
        }
      }

      return await prisma.message.findMany({
        where,
        include: {
          conversation: {
            select: { id: true, sessionId: true, title: true, agentId: true }
          },
          usageRecord: {
            select: { id: true, totalCost: true, totalTokens: true, model: true }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset
      })
    } catch (error) {
      throw new DatabaseError('Failed to get messages (V2)', error as Error)
    }
  }

  async getMessageById(
    organizationId: string,
    messageId: string
  ): Promise<MessageWithRelations | null> {
    try {
      return await prisma.message.findFirst({
        where: { 
          id: messageId,
          conversation: { organizationId }
        },
        include: {
          conversation: {
            select: { id: true, sessionId: true, title: true, agentId: true }
          },
          usageRecord: {
            select: { id: true, totalCost: true, totalTokens: true, model: true }
          }
        }
      })
    } catch (error) {
      throw new DatabaseError('Failed to get message by ID (V2)', error as Error)
    }
  }

  async createMessage(
    organizationId: string,
    data: CreateMessageData
  ): Promise<Message> {
    try {
      if (!data.conversationId?.trim()) {
        throw new ValidationError('Conversation ID is required')
      }

      if (!data.content?.trim()) {
        throw new ValidationError('Message content is required')
      }

      if (!data.role) {
        throw new ValidationError('Message role is required')
      }

      // Verify conversation exists and belongs to organization
      await this.getConversationByIdOrThrow(organizationId, data.conversationId)

      const message = await prisma.message.create({ 
        data: {
          conversationId: data.conversationId,
          role: data.role,
          content: data.content.trim(),
          tokenCount: data.tokenCount || null,
          finishReason: data.finishReason?.trim() || null,
          toolCalls: data.toolCalls,
          toolResults: data.toolResults,
          usageRecordId: data.usageRecordId?.trim() || null
        }
      })

      // Update conversation's lastMessageAt
      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: message.createdAt }
      })

      return message
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError('Failed to create message (V2)', error as Error)
    }
  }

  async updateMessage(
    organizationId: string,
    messageId: string,
    data: UpdateMessageData
  ): Promise<Message> {
    try {
      // Verify message exists and belongs to organization
      const existing = await this.getMessageById(organizationId, messageId)
      if (!existing) {
        throw new NotFoundError(`Message ${messageId} not found`)
      }

      const updateData: Record<string, unknown> = {}

      if (data.content !== undefined) updateData.content = data.content.trim()
      if (data.tokenCount !== undefined) updateData.tokenCount = data.tokenCount
      if (data.finishReason !== undefined) updateData.finishReason = data.finishReason?.trim() || null
      if (data.toolCalls !== undefined) updateData.toolCalls = data.toolCalls
      if (data.toolResults !== undefined) updateData.toolResults = data.toolResults
      if (data.usageRecordId !== undefined) updateData.usageRecordId = data.usageRecordId?.trim() || null

      return await prisma.message.update({
        where: { id: messageId },
        data: updateData
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError('Failed to update message (V2)', error as Error)
    }
  }

  async getConversationMessages(
    organizationId: string,
    conversationId: string
  ): Promise<Message[]> {
    try {
      // Verify conversation exists and belongs to organization
      await this.getConversationByIdOrThrow(organizationId, conversationId)

      return await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError('Failed to get conversation messages (V2)', error as Error)
    }
  }

  // =====================================
  // SESSION MANAGEMENT
  // =====================================

  async getSessionSummaries(
    organizationId: string,
    filters: SessionFilters = {}
  ): Promise<SessionSummary[]> {
    try {
      const {
        agentId,
        customerId,
        activeOnly,
        limit = 20,
        offset = 0
      } = filters

      const where: Record<string, unknown> = {
        organizationId
      }

      if (agentId) where.agentId = agentId
      if (customerId) where.customerId = customerId
      if (activeOnly) where.status = 'ACTIVE'

      // Aggregate conversations by session
      const sessions = await prisma.conversation.groupBy({
        by: ['sessionId', 'agentId'],
        where,
        _count: { id: true },
        _min: { createdAt: true },
        _max: { lastMessageAt: true },
        orderBy: { _max: { lastMessageAt: 'desc' } },
        take: limit,
        skip: offset
      })

      // Get additional details for each session
      const sessionSummaries: SessionSummary[] = []

      for (const session of sessions) {
        // Get message count and costs
        const messageStats = await prisma.message.aggregate({
          where: {
            conversation: {
              sessionId: session.sessionId,
              organizationId
            }
          },
          _count: { id: true }
        })

        const usageStats = await prisma.usageRecord.aggregate({
          where: {
            conversationId: {
              in: await prisma.conversation.findMany({
                where: { sessionId: session.sessionId, organizationId },
                select: { id: true }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              }).then((convs: any) => convs.map((c: any) => c.id))
            }
          },
          _sum: { totalCost: true, totalTokens: true }
        })

        // Get customer info and latest title
        const latestConversation = await prisma.conversation.findFirst({
          where: { sessionId: session.sessionId, organizationId },
          orderBy: { lastMessageAt: 'desc' },
          select: { 
            customerId: true, 
            customerName: true, 
            title: true 
          }
        })

        sessionSummaries.push({
          sessionId: session.sessionId,
          agentId: session.agentId,
          conversationCount: session._count.id,
          messageCount: messageStats._count.id || 0,
          totalCost: usageStats._sum.totalCost || 0,
          totalTokens: usageStats._sum.totalTokens || 0,
          lastActivity: session._max.lastMessageAt || session._min.createdAt!,
          firstConversation: session._min.createdAt!,
          customerId: latestConversation?.customerId || null,
          customerName: latestConversation?.customerName || null,
          latestTitle: latestConversation?.title || null
        })
      }

      return sessionSummaries
    } catch (error) {
      throw new DatabaseError('Failed to get session summaries (V2)', error as Error)
    }
  }

  async getConversationsBySession(
    organizationId: string,
    sessionId: string
  ): Promise<ConversationWithRelations[]> {
    return this.getConversations(organizationId, { sessionId })
  }

  // =====================================
  // ANALYTICS & STATS
  // =====================================

  async getConversationStats(
    organizationId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ConversationStats> {
    try {
      const where: Record<string, unknown> = { organizationId }
      
      if (dateFrom || dateTo) {
        where.createdAt = {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo })
        }
      }

      const [
        totalStats,
        activeStats,
        messageStats,
        usageStats,
        topAgentsData
      ] = await Promise.all([
        // Total conversations
        prisma.conversation.count({ where }),
        
        // Active conversations
        prisma.conversation.count({ 
          where: { ...where, status: 'ACTIVE' } 
        }),
        
        // Message stats
        prisma.message.count({
          where: { conversation: where }
        }),
        
        // Usage stats
        prisma.usageRecord.aggregate({
          where: { 
            conversation: where
          },
          _sum: { totalCost: true, totalTokens: true }
        }),
        
        // Top agents
        prisma.conversation.groupBy({
          by: ['agentId'],
          where,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5
        })
      ])

      // Get agent details for top agents
      const topAgents = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        topAgentsData.map(async (agentData: any) => {
          const agent = await prisma.agent.findUnique({
            where: { id: agentData.agentId },
            select: { name: true }
          })

          const [messageCount, agentUsage] = await Promise.all([
            prisma.message.count({
              where: {
                conversation: {
                  agentId: agentData.agentId,
                  ...where
                }
              }
            }),
            prisma.usageRecord.aggregate({
              where: {
                agentId: agentData.agentId,
                conversation: where
              },
              _sum: { totalCost: true }
            })
          ])

          return {
            agentId: agentData.agentId,
            agentName: agent?.name || 'Unknown Agent',
            conversationCount: agentData._count.id,
            messageCount,
            totalCost: agentUsage._sum.totalCost || 0
          }
        })
      )

      return {
        totalConversations: totalStats,
        activeConversations: activeStats,
        totalMessages: messageStats,
        totalCost: usageStats._sum.totalCost || 0,
        totalTokens: usageStats._sum.totalTokens || 0,
        averageConversationLength: totalStats > 0 ? messageStats / totalStats : 0,
        averageCost: totalStats > 0 ? (usageStats._sum.totalCost || 0) / totalStats : 0,
        topAgents
      }
    } catch (error) {
      throw new DatabaseError('Failed to get conversation stats (V2)', error as Error)
    }
  }
}

// Export singleton instance
export const conversationsService = new ConversationsService()