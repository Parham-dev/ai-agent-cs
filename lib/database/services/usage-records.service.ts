import { prisma } from '@/lib/database/database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  UsageRecord,
  UsageRecordWithRelations,
  CreateUsageRecordData,
  UsageRecordFilters
} from '@/lib/types/database'

class UsageRecordsService {
  /**
   * Get all usage records with optional filtering and pagination
   */
  async getUsageRecords(filters: UsageRecordFilters = {}): Promise<UsageRecordWithRelations[]> {
    try {
      const {
        organizationId,
        agentId,
        model,
        operation,
        source,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = filters

      const where = {
        ...(organizationId && { organizationId }),
        ...(agentId && { agentId }),
        ...(model && { model }),
        ...(operation && { operation }),
        ...(source && { source }),
        ...((startDate || endDate) && {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate })
          }
        })
      }

      const usageRecords = await prisma.usageRecord.findMany({
        where,
        include: {
          organization: {
            select: { name: true, slug: true }
          },
          agent: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return usageRecords as UsageRecordWithRelations[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch usage records', error as Error)
    }
  }

  /**
   * Get a single usage record by ID
   */
  async getUsageRecordById(id: string): Promise<UsageRecordWithRelations | null> {
    try {
      const usageRecord = await prisma.usageRecord.findUnique({
        where: { id },
        include: {
          organization: {
            select: { name: true, slug: true }
          },
          agent: {
            select: { name: true }
          }
        }
      })

      return usageRecord as UsageRecordWithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch usage record ${id}`, error as Error)
    }
  }

  /**
   * Get usage record by ID or throw error if not found
   */
  async getUsageRecordByIdOrThrow(id: string): Promise<UsageRecordWithRelations> {
    const usageRecord = await this.getUsageRecordById(id)
    if (!usageRecord) {
      throw new NotFoundError('Usage record', id)
    }
    return usageRecord
  }

  /**
   * Create a new usage record
   */
  async createUsageRecord(data: CreateUsageRecordData): Promise<UsageRecord> {
    try {
      // Validate required fields
      if (!data.organizationId) {
        throw new ValidationError('Organization ID is required', 'organizationId')
      }
      if (!data.model?.trim()) {
        throw new ValidationError('Model is required', 'model')
      }
      if (!data.operation?.trim()) {
        throw new ValidationError('Operation is required', 'operation')
      }
      if (!data.source?.trim()) {
        throw new ValidationError('Source is required', 'source')
      }
      if (data.totalTokens < 0) {
        throw new ValidationError('Total tokens cannot be negative', 'totalTokens')
      }
      if (data.totalCost < 0) {
        throw new ValidationError('Total cost cannot be negative', 'totalCost')
      }

      const usageRecord = await prisma.usageRecord.create({
        data: {
          organizationId: data.organizationId,
          agentId: data.agentId || null,
          model: data.model.trim(),
          operation: data.operation.trim(),
          promptTokens: data.promptTokens || 0,
          completionTokens: data.completionTokens || 0,
          totalTokens: data.totalTokens,
          inputCost: data.inputCost || 0,
          outputCost: data.outputCost || 0,
          totalCost: data.totalCost,
          userCost: data.userCost || data.totalCost, // Default to system cost if not provided
          source: data.source.trim(),
          requestId: data.requestId?.trim() || null,
          conversationId: data.conversationId?.trim() || null,
          metadata: data.metadata
        }
      })

      return usageRecord as UsageRecord
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create usage record', error as Error)
    }
  }

  /**
   * Get usage records by organization
   */
  async getUsageRecordsByOrganization(organizationId: string, filters: Omit<UsageRecordFilters, 'organizationId'> = {}): Promise<UsageRecordWithRelations[]> {
    return this.getUsageRecords({ ...filters, organizationId })
  }

  /**
   * Get usage records by agent
   */
  async getUsageRecordsByAgent(agentId: string, filters: Omit<UsageRecordFilters, 'agentId'> = {}): Promise<UsageRecordWithRelations[]> {
    return this.getUsageRecords({ ...filters, agentId })
  }

  /**
   * Get usage summary for organization
   */
  async getUsageSummary(organizationId: string, startDate?: Date, endDate?: Date): Promise<{
    totalCost: number
    totalTokens: number
    totalRecords: number
    costByModel: Record<string, number>
    costBySource: Record<string, number>
    tokensByModel: Record<string, number>
  }> {
    try {
      const where = {
        organizationId,
        ...((startDate || endDate) && {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate })
          }
        })
      }

      const usageRecords = await prisma.usageRecord.findMany({
        where,
        select: {
          totalCost: true,
          totalTokens: true,
          model: true,
          source: true
        }
      })

      const summary = {
        totalCost: 0,
        totalTokens: 0,
        totalRecords: usageRecords.length,
        costByModel: {} as Record<string, number>,
        costBySource: {} as Record<string, number>,
        tokensByModel: {} as Record<string, number>
      }

      for (const record of usageRecords) {
        summary.totalCost += record.totalCost
        summary.totalTokens += record.totalTokens

        // Group by model
        summary.costByModel[record.model] = (summary.costByModel[record.model] || 0) + record.totalCost
        summary.tokensByModel[record.model] = (summary.tokensByModel[record.model] || 0) + record.totalTokens

        // Group by source
        summary.costBySource[record.source] = (summary.costBySource[record.source] || 0) + record.totalCost
      }

      return summary
    } catch (error) {
      throw new DatabaseError('Failed to get usage summary', error as Error)
    }
  }

  /**
   * Get daily usage aggregates for a date range
   */
  async getDailyUsageAggregates(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; totalCost: number; totalTokens: number; totalRecords: number }>> {
    try {
      const dailyUsage = await prisma.usageRecord.groupBy({
        by: ['createdAt'],
        where: {
          organizationId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          totalCost: true,
          totalTokens: true
        },
        _count: {
          id: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      return dailyUsage.map(day => ({
        date: day.createdAt.toISOString().split('T')[0],
        totalCost: day._sum.totalCost || 0,
        totalTokens: day._sum.totalTokens || 0,
        totalRecords: day._count.id || 0
      }))
    } catch (error) {
      throw new DatabaseError('Failed to get daily usage aggregates', error as Error)
    }
  }

  /**
   * Delete old usage records (for cleanup)
   */
  async deleteOldUsageRecords(olderThan: Date): Promise<number> {
    try {
      const result = await prisma.usageRecord.deleteMany({
        where: {
          createdAt: {
            lt: olderThan
          }
        }
      })
      return result.count
    } catch (error) {
      throw new DatabaseError('Failed to delete old usage records', error as Error)
    }
  }
}

// Export singleton instance
export const usageRecordsService = new UsageRecordsService()
