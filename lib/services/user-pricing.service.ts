/**
 * User Pricing Service
 * Handles user-facing pricing calculations with margin on top of system costs
 * 
 * Responsibilities:
 * - Calculate user prices with margin
 * - Convert system costs to user costs
 * - Provide pricing transparency
 */

import { costCalculatorService, type UsageCosts } from './cost-calculator.service'
import type { UsageRecord, UsageRecordWithRelations } from '@/lib/types/database'

export interface UserPricing {
  systemCost: number
  userCost: number
  margin: number
  marginPercentage: number
}

export interface UserUsageCosts extends UsageCosts {
  userTotalCost: number
  userInputCost: number
  userOutputCost: number
  marginAmount: number
}

export class UserPricingService {
  private readonly MARGIN_PERCENTAGE = 0.15 // 15% margin

  /**
   * Calculate user cost from system cost
   */
  calculateUserCost(systemCost: number): number {
    return systemCost * (1 + this.MARGIN_PERCENTAGE)
  }

  /**
   * Get detailed pricing breakdown
   */
  getPricingBreakdown(systemCost: number): UserPricing {
    const userCost = this.calculateUserCost(systemCost)
    const margin = userCost - systemCost

    return {
      systemCost,
      userCost,
      margin,
      marginPercentage: this.MARGIN_PERCENTAGE * 100
    }
  }

  /**
   * Calculate user costs for token usage
   */
  calculateUserCosts(model: string, inputTokens: number, outputTokens: number): UserUsageCosts {
    // Get system costs first
    const systemCosts = costCalculatorService.calculateCosts(model, inputTokens, outputTokens)
    
    // Apply margin to each component
    const userInputCost = this.calculateUserCost(systemCosts.inputCost)
    const userOutputCost = this.calculateUserCost(systemCosts.outputCost)
    const userTotalCost = userInputCost + userOutputCost
    const marginAmount = userTotalCost - systemCosts.totalCost

    return {
      ...systemCosts,
      userTotalCost,
      userInputCost,
      userOutputCost,
      marginAmount
    }
  }

  /**
   * Convert usage records to include user costs
   */
  enrichUsageRecordsWithUserCosts(records: UsageRecord[]): Array<UsageRecord & { userCost: number }>
  enrichUsageRecordsWithUserCosts(records: UsageRecordWithRelations[]): Array<UsageRecordWithRelations & { userCost: number }>
  enrichUsageRecordsWithUserCosts(records: (UsageRecord | UsageRecordWithRelations)[]): Array<(UsageRecord | UsageRecordWithRelations) & { userCost: number }> {
    return records.map(record => ({
      ...record,
      userCost: record.userCost || this.calculateUserCost(record.totalCost)
    }))
  }

  /**
   * Aggregate user costs from usage records
   */
  aggregateUserCosts(records: Array<{ userCost: number; totalCost: number }>): {
    totalSystemCost: number
    totalUserCost: number
    totalMargin: number
    marginPercentage: number
  } {
    const totalSystemCost = records.reduce((sum, record) => sum + record.totalCost, 0)
    const totalUserCost = records.reduce((sum, record) => sum + record.userCost, 0)
    const totalMargin = totalUserCost - totalSystemCost

    return {
      totalSystemCost,
      totalUserCost,
      totalMargin,
      marginPercentage: this.MARGIN_PERCENTAGE * 100
    }
  }

  /**
   * Get user-facing model pricing (with margin applied)
   */
  getUserModelPricing() {
    const systemPricing = costCalculatorService.getModelPricing()
    const userPricing: Record<string, { input: number; output: number }> = {}

    for (const [model, pricing] of Object.entries(systemPricing)) {
      userPricing[model] = {
        input: this.calculateUserCost(pricing.input),
        output: this.calculateUserCost(pricing.output)
      }
    }

    return userPricing
  }

  /**
   * Get margin percentage
   */
  getMarginPercentage(): number {
    return this.MARGIN_PERCENTAGE * 100
  }

  /**
   * Format cost for display (rounds to 4 decimal places)
   */
  formatCost(cost: number): string {
    return `$${cost.toFixed(4)}`
  }

  /**
   * Format cost in cents/pence
   */
  formatCostInCents(cost: number): string {
    const cents = cost * 100
    return `${cents.toFixed(2)}¢`
  }
}

// Export singleton instance
export const userPricingService = new UserPricingService()