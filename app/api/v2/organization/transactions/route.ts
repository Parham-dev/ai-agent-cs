import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { ApiResponseHelper as Api, validateMethod, withErrorHandling } from '@/lib/api/helpers'
import { creditTransactionsService } from '@/lib/database/services/credit-transactions.service'
import { userPricingService } from '@/lib/services/user-pricing.service'
import type { AuthContext } from '@/lib/types/auth'
import type { TransactionType } from '@/lib/types/database'

/**
 * Get organization credit transaction history
 * Supports filtering and pagination
 */
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
    const methodError = validateMethod(request, ['GET'])
    if (methodError) return methodError

    const { user } = context
    if (!user.organizationId) {
      return Api.error('VALIDATION_ERROR', 'User is not associated with an organization')
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 records
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') as TransactionType | undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const days = parseInt(searchParams.get('days') || '30')

    // Validate parameters
    if (startDate && isNaN(startDate.getTime())) {
      return Api.error('VALIDATION_ERROR', 'Invalid startDate format')
    }
    if (endDate && isNaN(endDate.getTime())) {
      return Api.error('VALIDATION_ERROR', 'Invalid endDate format')
    }
    if (type && !['CREDIT_PURCHASE', 'USAGE_DEDUCTION', 'FREE_CREDIT', 'REFUND'].includes(type)) {
      return Api.error('VALIDATION_ERROR', 'Invalid transaction type')
    }

    // Get transactions
    const transactions = await creditTransactionsService.getCreditTransactions({
      organizationId: user.organizationId,
      type,
      startDate,
      endDate,
      limit,
      offset
    })

    // Get summary for the filtered period
    const summary = await creditTransactionsService.getOrganizationTransactionSummary(
      user.organizationId,
      startDate,
      endDate
    )

    // Get daily transaction totals for trend analysis
    const dailyTotals = await creditTransactionsService.getDailyTransactionTotals(
      user.organizationId,
      days
    )

    const transactionData = {
      // Transaction records
      transactions: transactions.map(transaction => ({
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        formattedAmount: transaction.amount > 0 
          ? `+${userPricingService.formatCost(transaction.amount)}`
          : `-${userPricingService.formatCost(Math.abs(transaction.amount))}`,
        formattedAmountAbs: userPricingService.formatCost(Math.abs(transaction.amount)),
        isCredit: transaction.amount > 0,
        isDebit: transaction.amount < 0,
        createdAt: transaction.createdAt.toISOString(),
        metadata: transaction.metadata,
        // Include organization name if available
        ...(transaction.organization && { organizationName: transaction.organization.name })
      })),

      // Pagination metadata
      pagination: {
        limit,
        offset,
        total: transactions.length, // Note: This is just the current page, not total count
        hasMore: transactions.length === limit
      },

      // Summary for the filtered period
      summary: {
        totalPurchased: summary.totalPurchased,
        totalUsed: summary.totalUsed,
        totalRefunded: summary.totalRefunded,
        totalFreeCredits: summary.totalFreeCredits,
        netCredits: summary.netCredits,
        transactionCount: summary.transactionCount,
        // Formatted amounts
        formattedPurchased: userPricingService.formatCost(summary.totalPurchased),
        formattedUsed: userPricingService.formatCost(summary.totalUsed),
        formattedRefunded: userPricingService.formatCost(summary.totalRefunded),
        formattedFreeCredits: userPricingService.formatCost(summary.totalFreeCredits),
        formattedNetCredits: summary.netCredits >= 0 
          ? `+${userPricingService.formatCost(summary.netCredits)}`
          : `-${userPricingService.formatCost(Math.abs(summary.netCredits))}`
      },

      // Daily trend data
      dailyTrend: dailyTotals.map(day => ({
        date: day.date,
        credits: day.credits,
        debits: day.debits,
        net: day.net,
        transactionCount: day.transactionCount,
        formattedCredits: userPricingService.formatCost(day.credits),
        formattedDebits: userPricingService.formatCost(day.debits),
        formattedNet: day.net >= 0 
          ? `+${userPricingService.formatCost(day.net)}`
          : `-${userPricingService.formatCost(Math.abs(day.net))}`
      })),

      // Transaction type breakdown for the period
      breakdown: {
        byType: [
          {
            type: 'CREDIT_PURCHASE',
            amount: summary.totalPurchased,
            count: transactions.filter(t => t.type === 'CREDIT_PURCHASE').length,
            formattedAmount: userPricingService.formatCost(summary.totalPurchased),
            description: 'Credits purchased'
          },
          {
            type: 'USAGE_DEDUCTION',
            amount: summary.totalUsed,
            count: transactions.filter(t => t.type === 'USAGE_DEDUCTION').length,
            formattedAmount: userPricingService.formatCost(summary.totalUsed),
            description: 'API usage costs'
          },
          {
            type: 'FREE_CREDIT',
            amount: summary.totalFreeCredits,
            count: transactions.filter(t => t.type === 'FREE_CREDIT').length,
            formattedAmount: userPricingService.formatCost(summary.totalFreeCredits),
            description: 'Free credits received'
          },
          {
            type: 'REFUND',
            amount: summary.totalRefunded,
            count: transactions.filter(t => t.type === 'REFUND').length,
            formattedAmount: userPricingService.formatCost(summary.totalRefunded),
            description: 'Refunded credits'
          }
        ].filter(item => item.amount > 0 || item.count > 0) // Only show types with activity
      },

      // Filter information
      filters: {
        type,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        period: startDate && endDate 
          ? `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
          : `Last ${days} days`,
        appliedFilters: {
          hasTypeFilter: !!type,
          hasDateFilter: !!(startDate || endDate)
        }
      }
    }

    return Api.success(transactionData, {
      organizationId: user.organizationId,
      transactionCount: transactions.length,
      timestamp: new Date().toISOString()
    })
  })
)