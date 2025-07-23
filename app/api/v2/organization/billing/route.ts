import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { ApiResponseHelper as Api, validateMethod, withErrorHandling } from '@/lib/api/helpers'
import { organizationCreditsService } from '@/lib/database/services/organization-credits.service'
import { costAnalyticsService } from '@/lib/services/cost-analytics.service'
import { userPricingService } from '@/lib/services/user-pricing.service'
import { conversationsService } from '@/lib/database/services/conversations.service'
import type { AuthContext } from '@/lib/types/auth'

/**
 * Get organization billing information
 * Returns credit balance, usage summary, and pricing information
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

    // Get usage summary
    const costSummary = await costAnalyticsService.getCostSummary(user.organizationId)

    // Get budget status
    const budgetStatus = await costAnalyticsService.checkBudgetStatus(user.organizationId)

    // Get conversation statistics for current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthConversations = await conversationsService.getConversationStats(
      user.organizationId,
      startOfMonth,
      now
    )

    // Get conversation statistics for last month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const lastMonthConversations = await conversationsService.getConversationStats(
      user.organizationId,
      startOfLastMonth,
      endOfLastMonth
    )

    // Get pricing information
    const marginPercentage = userPricingService.getMarginPercentage()

    const billingInfo = {
      // Credit information
      credits: {
        available: credits?.credits || 0,
        freeCredits: creditStats.freeCredits,
        paidCredits: creditStats.paidCredits,
        usedCredits: creditStats.usedCredits,
        formattedBalance: userPricingService.formatCost(credits?.credits || 0),
        formattedBalanceInCents: userPricingService.formatCostInCents(credits?.credits || 0)
      },

      // Current month usage
      currentMonth: {
        totalSystemCost: costSummary.currentMonth.totalCost,
        totalUserCost: userPricingService.calculateUserCost(costSummary.currentMonth.totalCost),
        totalTokens: costSummary.currentMonth.totalTokens,
        conversations: currentMonthConversations.totalConversations,
        formattedCost: userPricingService.formatCost(
          userPricingService.calculateUserCost(costSummary.currentMonth.totalCost)
        )
      },

      // Last month comparison
      lastMonth: {
        totalSystemCost: costSummary.lastMonth.totalCost,
        totalUserCost: userPricingService.calculateUserCost(costSummary.lastMonth.totalCost),
        totalTokens: costSummary.lastMonth.totalTokens,
        conversations: lastMonthConversations.totalConversations,
        formattedCost: userPricingService.formatCost(
          userPricingService.calculateUserCost(costSummary.lastMonth.totalCost)
        )
      },

      // Budget status
      budget: {
        isWithinBudget: budgetStatus.isWithinBudget,
        currentSpend: budgetStatus.currentSpend,
        monthlyBudget: budgetStatus.monthlyBudget,
        alertThreshold: budgetStatus.alertThreshold,
        shouldAlert: budgetStatus.shouldAlert,
        percentageUsed: budgetStatus.monthlyBudget 
          ? (budgetStatus.currentSpend / budgetStatus.monthlyBudget) * 100 
          : null
      },

      // Top models by cost
      topModels: costSummary.topModels.map(model => ({
        ...model,
        userCost: userPricingService.calculateUserCost(model.cost),
        formattedCost: userPricingService.formatCost(
          userPricingService.calculateUserCost(model.cost)
        )
      })),

      // Recent cost trend (last 7 days)
      recentTrend: costSummary.recentTrend.map(day => ({
        ...day,
        userCost: userPricingService.calculateUserCost(day.cost),
        formattedCost: userPricingService.formatCost(
          userPricingService.calculateUserCost(day.cost)
        )
      })),

      // Pricing information
      pricing: {
        marginPercentage,
        description: `All costs include a ${marginPercentage}% margin on top of system costs`
      }
    }

    return Api.success(billingInfo, {
      organizationId: user.organizationId,
      timestamp: new Date().toISOString()
    })
  })
)