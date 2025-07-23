import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { ApiResponseHelper as Api, validateMethod, withErrorHandling } from '@/lib/api/helpers'
import { organizationCreditsService } from '@/lib/database/services/organization-credits.service'
import { creditTransactionsService } from '@/lib/database/services/credit-transactions.service'
import { userPricingService } from '@/lib/services/user-pricing.service'
import type { AuthContext } from '@/lib/types/auth'

interface AddCreditsRequest {
  amount: number
  description?: string
  paymentMethod?: 'stripe' | 'paypal' | 'manual'
  paymentId?: string
  invoiceId?: string
}

/**
 * Get organization credit balance and statistics
 */
export const GET = withAuth(
  withErrorHandling(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
    const methodError = validateMethod(request, ['GET'])
    if (methodError) return methodError

    const { user } = context
    if (!user.organizationId) {
      return Api.error('VALIDATION_ERROR', 'User is not associated with an organization')
    }

    // Get credit information
    const credits = await organizationCreditsService.getOrganizationCredits(user.organizationId)
    const creditStats = await organizationCreditsService.getCreditStats(user.organizationId)

    // Get recent transactions for context
    const recentTransactions = await creditTransactionsService.getRecentTransactions(
      user.organizationId,
      5
    )

    const creditInfo = {
      balance: {
        available: credits?.credits || 0,
        freeCredits: creditStats.freeCredits,
        paidCredits: creditStats.paidCredits,
        usedCredits: creditStats.usedCredits,
        formattedBalance: userPricingService.formatCost(credits?.credits || 0),
        formattedBalanceInCents: userPricingService.formatCostInCents(credits?.credits || 0)
      },

      statistics: {
        totalEverPurchased: creditStats.paidCredits,
        totalEverUsed: creditStats.usedCredits,
        totalFreeCreditsReceived: creditStats.freeCredits,
        currentUtilization: creditStats.freeCredits + creditStats.paidCredits > 0 
          ? (creditStats.usedCredits / (creditStats.freeCredits + creditStats.paidCredits)) * 100 
          : 0
      },

      recentActivity: recentTransactions.map(transaction => ({
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        formattedAmount: transaction.amount > 0 
          ? `+${userPricingService.formatCost(transaction.amount)}`
          : userPricingService.formatCost(Math.abs(transaction.amount)),
        createdAt: transaction.createdAt.toISOString()
      })),

      lowBalanceWarning: (credits?.credits || 0) < 1.0 ? {
        warning: true,
        message: 'Your credit balance is low. Consider adding more credits to avoid service interruption.',
        threshold: 1.0,
        current: credits?.credits || 0
      } : null
    }

    return Api.success(creditInfo, {
      organizationId: user.organizationId,
      timestamp: new Date().toISOString()
    })
  })
)

/**
 * Add credits to organization
 * This endpoint would typically be called after successful payment processing
 */
export const POST = withAuth(
  withErrorHandling(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
    const methodError = validateMethod(request, ['POST'])
    if (methodError) return methodError

    const { user } = context
    if (!user.organizationId) {
      return Api.error('VALIDATION_ERROR', 'User is not associated with an organization')
    }

    // Only allow admins to add credits for now
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return Api.error('AUTHORIZATION_ERROR', 'Only administrators can add credits')
    }

    let requestData: AddCreditsRequest
    try {
      requestData = await request.json()
    } catch {
      return Api.error('VALIDATION_ERROR', 'Invalid JSON in request body')
    }

    // Validate request data
    if (typeof requestData.amount !== 'number' || requestData.amount <= 0) {
      return Api.error('VALIDATION_ERROR', 'Amount must be a positive number')
    }

    if (requestData.amount > 1000) {
      return Api.error('VALIDATION_ERROR', 'Maximum credit addition is $1000 per transaction')
    }

    // Add credits to organization
    const updatedCredits = await organizationCreditsService.addCredits(
      user.organizationId,
      requestData.amount,
      true // isPaidCredit
    )

    // Create transaction record
    const transaction = await creditTransactionsService.createCreditTransaction({
      organizationId: user.organizationId,
      amount: requestData.amount,
      type: 'CREDIT_PURCHASE',
      description: requestData.description || `Credits purchased - ${userPricingService.formatCost(requestData.amount)}`,
      metadata: {
        paymentMethod: requestData.paymentMethod || 'manual',
        paymentId: requestData.paymentId,
        invoiceId: requestData.invoiceId,
        performedBy: user.id,
        adminNotes: `Credits added by ${user.name || user.email}`
      }
    })

    const result = {
      success: true,
      creditsAdded: requestData.amount,
      newBalance: updatedCredits.credits,
      formattedAmount: userPricingService.formatCost(requestData.amount),
      formattedNewBalance: userPricingService.formatCost(updatedCredits.credits),
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        createdAt: transaction.createdAt.toISOString()
      }
    }

    return Api.success(result, {
      organizationId: user.organizationId,
      performedBy: user.id,
      timestamp: new Date().toISOString()
    }, 201)
  })
)