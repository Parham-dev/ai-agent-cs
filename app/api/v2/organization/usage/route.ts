import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { ApiResponseHelper as Api, validateMethod, withErrorHandling } from '@/lib/api/helpers'
import { usageRecordsService } from '@/lib/database/services/usage-records.service'
import { costAnalyticsService } from '@/lib/services/cost-analytics.service'
import { userPricingService } from '@/lib/services/user-pricing.service'
import type { AuthContext } from '@/lib/types/auth'

/**
 * Get organization usage records and analytics
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
    const model = searchParams.get('model') || undefined
    const source = searchParams.get('source') || undefined
    const agentId = searchParams.get('agentId') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const days = parseInt(searchParams.get('days') || '30')

    // Validate date range
    if (startDate && isNaN(startDate.getTime())) {
      return Api.error('VALIDATION_ERROR', 'Invalid startDate format')
    }
    if (endDate && isNaN(endDate.getTime())) {
      return Api.error('VALIDATION_ERROR', 'Invalid endDate format')
    }

    // Get usage records (these include relations)
    const usageRecordsWithRelations = await usageRecordsService.getUsageRecords({
      organizationId: user.organizationId,
      model,
      source,
      agentId,
      startDate,
      endDate,
      limit,
      offset
    })

    // Enrich with user costs - explicitly cast to help TypeScript
    const enrichedRecords = userPricingService.enrichUsageRecordsWithUserCosts(usageRecordsWithRelations) as Array<typeof usageRecordsWithRelations[0] & { userCost: number }>

    // Get organization costs for the same period
    const organizationCosts = await costAnalyticsService.getOrganizationCosts(
      user.organizationId,
      startDate,
      endDate
    )

    // Get cost breakdown
    const costBreakdown = await costAnalyticsService.getOrganizationCostBreakdown(
      user.organizationId,
      startDate,
      endDate
    )

    // Get daily costs for trend analysis
    const dailyCosts = await costAnalyticsService.getDailyCosts(user.organizationId, days)

    // Calculate user cost totals (for potential future use)
    // const userCostTotals = userPricingService.aggregateUserCosts(enrichedRecords)

    const usageData = {
      // Usage records with pagination info  
      usage: enrichedRecords.map(record => ({
        id: record.id,
        model: record.model,
        operation: record.operation,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        totalTokens: record.totalTokens,
        systemCost: record.totalCost,
        userCost: record.userCost,
        formattedSystemCost: userPricingService.formatCost(record.totalCost),
        formattedUserCost: userPricingService.formatCost(record.userCost),
        source: record.source,
        agentId: record.agentId,
        conversationId: record.conversationId,
        createdAt: record.createdAt.toISOString(),
        // Include related data if available
        ...(record.organization && { organizationName: record.organization.name }),
        ...(record.agent && { agentName: record.agent.name })
      })),

      // Pagination metadata
      pagination: {
        limit,
        offset,
        total: enrichedRecords.length, // Note: This is just the current page, not total count
        hasMore: enrichedRecords.length === limit
      },

      // Cost summary for the filtered period
      summary: {
        totalSystemCost: organizationCosts.totalCost,
        totalUserCost: userPricingService.calculateUserCost(organizationCosts.totalCost),
        totalMargin: userPricingService.calculateUserCost(organizationCosts.totalCost) - organizationCosts.totalCost,
        totalTokens: organizationCosts.totalTokens,
        totalRequests: enrichedRecords.length,
        formattedSystemCost: userPricingService.formatCost(organizationCosts.totalCost),
        formattedUserCost: userPricingService.formatCost(
          userPricingService.calculateUserCost(organizationCosts.totalCost)
        ),
        averageCostPerRequest: enrichedRecords.length > 0 
          ? userPricingService.calculateUserCost(organizationCosts.totalCost) / enrichedRecords.length 
          : 0
      },

      // Breakdown by model
      breakdown: {
        byModel: Object.entries(costBreakdown.costByModel).map(([model, systemCost]) => ({
          model,
          systemCost,
          userCost: userPricingService.calculateUserCost(systemCost),
          formattedSystemCost: userPricingService.formatCost(systemCost),
          formattedUserCost: userPricingService.formatCost(
            userPricingService.calculateUserCost(systemCost)
          ),
          tokens: costBreakdown.tokensByModel[model] || 0,
          requests: costBreakdown.requestsByModel[model] || 0
        })),

        bySource: Object.entries(costBreakdown.costBySource).map(([source, systemCost]) => ({
          source,
          systemCost,
          userCost: userPricingService.calculateUserCost(systemCost),
          formattedSystemCost: userPricingService.formatCost(systemCost),
          formattedUserCost: userPricingService.formatCost(
            userPricingService.calculateUserCost(systemCost)
          )
        }))
      },

      // Daily trend data
      dailyTrend: dailyCosts.map(day => ({
        date: day.date,
        systemCost: day.cost,
        userCost: userPricingService.calculateUserCost(day.cost),
        formattedSystemCost: userPricingService.formatCost(day.cost),
        formattedUserCost: userPricingService.formatCost(
          userPricingService.calculateUserCost(day.cost)
        ),
        tokens: day.tokens,
        requests: day.requests
      })),

      // Filter information
      filters: {
        model,
        source,
        agentId,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        period: startDate && endDate 
          ? `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
          : `Last ${days} days`
      }
    }

    return Api.success(usageData, {
      organizationId: user.organizationId,
      recordCount: enrichedRecords.length,
      timestamp: new Date().toISOString()
    })
  })
)