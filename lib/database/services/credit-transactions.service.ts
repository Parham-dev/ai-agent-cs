import { prisma } from '@/lib/database/database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  CreditTransaction,
  CreditTransactionWithRelations,
  CreateCreditTransactionData,
  CreditTransactionFilters,
  TransactionType
} from '@/lib/types/database'

class CreditTransactionsService {
  /**
   * Get all credit transactions with optional filtering and pagination
   */
  async getCreditTransactions(filters: CreditTransactionFilters = {}): Promise<CreditTransactionWithRelations[]> {
    try {
      const {
        organizationId,
        type,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = filters

      const where = {
        ...(organizationId && { organizationId }),
        ...(type && { type }),
        ...((startDate || endDate) && {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate })
          }
        })
      }

      const transactions = await prisma.creditTransaction.findMany({
        where,
        include: {
          organization: {
            select: { name: true, slug: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return transactions as CreditTransactionWithRelations[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch credit transactions', error as Error)
    }
  }

  /**
   * Get a single credit transaction by ID
   */
  async getCreditTransactionById(id: string): Promise<CreditTransactionWithRelations | null> {
    try {
      const transaction = await prisma.creditTransaction.findUnique({
        where: { id },
        include: {
          organization: {
            select: { name: true, slug: true }
          }
        }
      })

      return transaction as CreditTransactionWithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch credit transaction ${id}`, error as Error)
    }
  }

  /**
   * Get credit transaction by ID or throw error if not found
   */
  async getCreditTransactionByIdOrThrow(id: string): Promise<CreditTransactionWithRelations> {
    const transaction = await this.getCreditTransactionById(id)
    if (!transaction) {
      throw new NotFoundError('Credit transaction', id)
    }
    return transaction
  }

  /**
   * Create a new credit transaction
   */
  async createCreditTransaction(data: CreateCreditTransactionData): Promise<CreditTransaction> {
    try {
      // Validate required fields
      if (!data.organizationId) {
        throw new ValidationError('Organization ID is required', 'organizationId')
      }
      if (!data.type) {
        throw new ValidationError('Transaction type is required', 'type')
      }
      if (typeof data.amount !== 'number') {
        throw new ValidationError('Amount is required and must be a number', 'amount')
      }

      // Validate amount based on transaction type
      const isDeduction = data.type === 'USAGE_DEDUCTION'
      if (isDeduction && data.amount > 0) {
        // Usage deductions should be negative
        data.amount = -Math.abs(data.amount)
      } else if (!isDeduction && data.amount < 0) {
        // Credits should be positive
        throw new ValidationError('Credit amount must be positive', 'amount')
      }

      const transaction = await prisma.creditTransaction.create({
        data: {
          organizationId: data.organizationId,
          amount: data.amount,
          type: data.type,
          description: data.description?.trim() || null,
          metadata: data.metadata || {}
        }
      })

      return transaction as CreditTransaction
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create credit transaction', error as Error)
    }
  }

  /**
   * Get organization transaction summary
   */
  async getOrganizationTransactionSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalPurchased: number
    totalUsed: number
    totalRefunded: number
    totalFreeCredits: number
    netCredits: number
    transactionCount: number
  }> {
    try {
      const transactions = await this.getCreditTransactions({
        organizationId,
        startDate,
        endDate,
        limit: 1000 // Get more transactions for summary
      })

      const summary = transactions.reduce(
        (acc, transaction) => {
          acc.transactionCount++
          
          switch (transaction.type) {
            case 'CREDIT_PURCHASE':
              acc.totalPurchased += transaction.amount
              break
            case 'USAGE_DEDUCTION':
              acc.totalUsed += Math.abs(transaction.amount)
              break
            case 'REFUND':
              acc.totalRefunded += transaction.amount
              break
            case 'FREE_CREDIT':
              acc.totalFreeCredits += transaction.amount
              break
          }
          
          acc.netCredits += transaction.amount
          return acc
        },
        {
          totalPurchased: 0,
          totalUsed: 0,
          totalRefunded: 0,
          totalFreeCredits: 0,
          netCredits: 0,
          transactionCount: 0
        }
      )

      return summary
    } catch (error) {
      throw new DatabaseError('Failed to get transaction summary', error as Error)
    }
  }

  /**
   * Get recent transactions for organization
   */
  async getRecentTransactions(
    organizationId: string,
    limit: number = 10
  ): Promise<CreditTransactionWithRelations[]> {
    return this.getCreditTransactions({
      organizationId,
      limit,
      offset: 0
    })
  }

  /**
   * Create usage deduction transaction
   */
  async createUsageDeduction(params: {
    organizationId: string
    amount: number
    usageRecordId: string
    conversationId?: string
    agentId?: string
    model?: string
    description?: string
  }): Promise<CreditTransaction> {
    const metadata: PrismaJson.CreditTransactionMetadata = {
      usageRecordId: params.usageRecordId,
      conversationId: params.conversationId,
      agentId: params.agentId,
      model: params.model
    }

    return this.createCreditTransaction({
      organizationId: params.organizationId,
      amount: -Math.abs(params.amount), // Ensure negative
      type: 'USAGE_DEDUCTION',
      description: params.description || `API usage for model ${params.model || 'unknown'}`,
      metadata
    })
  }

  /**
   * Create free credit transaction (e.g., for new organizations)
   */
  async createFreeCredit(params: {
    organizationId: string
    amount: number
    description?: string
    adminNotes?: string
    performedBy?: string
  }): Promise<CreditTransaction> {
    const metadata: PrismaJson.CreditTransactionMetadata = {
      adminNotes: params.adminNotes,
      performedBy: params.performedBy
    }

    return this.createCreditTransaction({
      organizationId: params.organizationId,
      amount: Math.abs(params.amount), // Ensure positive
      type: 'FREE_CREDIT',
      description: params.description || 'Free credits granted',
      metadata
    })
  }

  /**
   * Get transactions by type for organization
   */
  async getTransactionsByType(
    organizationId: string,
    type: TransactionType,
    limit: number = 50
  ): Promise<CreditTransactionWithRelations[]> {
    return this.getCreditTransactions({
      organizationId,
      type,
      limit,
      offset: 0
    })
  }

  /**
   * Calculate daily transaction totals
   */
  async getDailyTransactionTotals(
    organizationId: string,
    days: number = 30
  ): Promise<Array<{
    date: string
    credits: number
    debits: number
    net: number
    transactionCount: number
  }>> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - days)

      const transactions = await this.getCreditTransactions({
        organizationId,
        startDate,
        endDate,
        limit: 1000
      })

      // Group by date
      const dailyTotals = new Map<string, {
        credits: number
        debits: number
        net: number
        transactionCount: number
      }>()

      transactions.forEach(transaction => {
        const date = transaction.createdAt.toISOString().split('T')[0]
        const existing = dailyTotals.get(date) || {
          credits: 0,
          debits: 0,
          net: 0,
          transactionCount: 0
        }

        if (transaction.amount > 0) {
          existing.credits += transaction.amount
        } else {
          existing.debits += Math.abs(transaction.amount)
        }
        existing.net += transaction.amount
        existing.transactionCount++

        dailyTotals.set(date, existing)
      })

      // Convert to array and sort by date
      return Array.from(dailyTotals.entries())
        .map(([date, totals]) => ({ date, ...totals }))
        .sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
      throw new DatabaseError('Failed to calculate daily transaction totals', error as Error)
    }
  }
}

// Export singleton instance
export const creditTransactionsService = new CreditTransactionsService()