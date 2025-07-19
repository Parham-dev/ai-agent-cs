/**
 * Cost Analytics Service
 * Handles cost reporting, analytics, and budget management
 * 
 * Responsibilities:
 * - Generate cost reports and breakdowns
 * - Monitor budget status and alerts
 * - Provide cost analytics and trends
 * - Recommend optimal models based on budget constraints
 */

import { usageRecordsService } from '@/lib/database/services/usage-records.service';
import { billingConfigsService } from '@/lib/database/services/billing-configs.service';
import { CostCalculatorService, type UsageCosts } from './cost-calculator.service';

export interface DailyCosts {
  date: string;
  cost: number;
  tokens: number;
  requests: number;
}

export interface CostBreakdown {
  totalCost: number;
  costByModel: Record<string, number>;
  costBySource: Record<string, number>;
  tokensByModel: Record<string, number>;
  requestsByModel: Record<string, number>;
}

export interface BudgetStatus {
  isWithinBudget: boolean;
  currentSpend: number;
  monthlyBudget: number | null;
  alertThreshold: number;
  shouldAlert: boolean;
}

export class CostAnalyticsService {
  private costCalculator = new CostCalculatorService();

  /**
   * Get total costs for organization within date range
   */
  async getOrganizationCosts(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageCosts> {
    const records = await usageRecordsService.getUsageRecordsByOrganization(
      organizationId,
      { startDate, endDate }
    );

    return this.costCalculator.aggregateCosts(records);
  }

  /**
   * Get total costs for agent within date range
   */
  async getAgentCosts(
    agentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageCosts> {
    const records = await usageRecordsService.getUsageRecordsByAgent(
      agentId,
      { startDate, endDate }
    );

    return this.costCalculator.aggregateCosts(records);
  }

  /**
   * Get detailed cost breakdown for organization
   */
  async getOrganizationCostBreakdown(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CostBreakdown> {
    const records = await usageRecordsService.getUsageRecordsByOrganization(
      organizationId,
      { startDate, endDate }
    );

    const breakdown: CostBreakdown = {
      totalCost: 0,
      costByModel: {},
      costBySource: {},
      tokensByModel: {},
      requestsByModel: {}
    };

    for (const record of records) {
      breakdown.totalCost += record.totalCost;
      
      // By model
      breakdown.costByModel[record.model] = (breakdown.costByModel[record.model] || 0) + record.totalCost;
      breakdown.tokensByModel[record.model] = (breakdown.tokensByModel[record.model] || 0) + record.totalTokens;
      breakdown.requestsByModel[record.model] = (breakdown.requestsByModel[record.model] || 0) + 1;
      
      // By source
      breakdown.costBySource[record.source] = (breakdown.costBySource[record.source] || 0) + record.totalCost;
    }

    return breakdown;
  }

  /**
   * Get daily cost trends for organization
   */
  async getDailyCosts(
    organizationId: string,
    days: number = 30
  ): Promise<DailyCosts[]> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const dailyUsage = await usageRecordsService.getDailyUsageAggregates(organizationId, startDate, endDate);
    
    return dailyUsage.map(day => ({
      date: day.date,
      cost: day.totalCost,
      tokens: day.totalTokens,
      requests: day.totalRecords
    }));
  }

  /**
   * Check if organization is within budget
   */
  async checkBudgetStatus(organizationId: string): Promise<BudgetStatus> {
    // Get current month spend
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const costs = await this.getOrganizationCosts(organizationId, startOfMonth);
    const budgetInfo = await billingConfigsService.getBudgetInfo(organizationId);
    
    const shouldAlert = budgetInfo.monthlyBudget !== null && 
                       costs.totalCost >= (budgetInfo.monthlyBudget * budgetInfo.alertThreshold);
    
    const isWithinBudget = budgetInfo.monthlyBudget === null || 
                          costs.totalCost <= budgetInfo.monthlyBudget;

    return {
      isWithinBudget,
      currentSpend: costs.totalCost,
      monthlyBudget: budgetInfo.monthlyBudget,
      alertThreshold: budgetInfo.alertThreshold,
      shouldAlert
    };
  }

  /**
   * Get recommended model based on budget constraints
   */
  async getRecommendedModel(organizationId: string, estimatedTokens: number = 1000): Promise<string> {
    const budgetInfo = await billingConfigsService.getBudgetInfo(organizationId);
    
    // If auto-optimization is disabled, return preferred model
    const hasAutoOptimization = await billingConfigsService.hasAutoOptimization(organizationId);
    if (!hasAutoOptimization) {
      return await billingConfigsService.getPreferredModel(organizationId);
    }

    // Check if we're close to budget limit
    const budgetStatus = await this.checkBudgetStatus(organizationId);
    
    // If close to budget or over budget, recommend cheaper model
    if (!budgetStatus.isWithinBudget || budgetStatus.shouldAlert) {
      return 'gpt-4o-mini';
    }

    // Check max cost per message constraint
    if (budgetInfo.maxCostPerMessage) {
      const gpt4oCost = this.costCalculator.estimateMessageCost('gpt-4o', estimatedTokens, estimatedTokens);
      if (gpt4oCost > budgetInfo.maxCostPerMessage) {
        return 'gpt-4o-mini';
      }
    }

    // Return preferred model
    return await billingConfigsService.getPreferredModel(organizationId);
  }

  /**
   * Get cost summary for dashboard display
   */
  async getCostSummary(organizationId: string): Promise<{
    currentMonth: UsageCosts;
    lastMonth: UsageCosts;
    budgetStatus: BudgetStatus;
    topModels: Array<{ model: string; cost: number; usage: number }>;
    recentTrend: DailyCosts[];
  }> {
    const now = new Date();
    
    // Current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonth = await this.getOrganizationCosts(organizationId, currentMonthStart);
    
    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonth = await this.getOrganizationCosts(organizationId, lastMonthStart, lastMonthEnd);
    
    // Budget status
    const budgetStatus = await this.checkBudgetStatus(organizationId);
    
    // Cost breakdown for top models
    const breakdown = await this.getOrganizationCostBreakdown(organizationId, currentMonthStart);
    const topModels = Object.entries(breakdown.costByModel)
      .map(([model, cost]) => ({
        model,
        cost,
        usage: breakdown.tokensByModel[model] || 0
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
    
    // Recent trend (last 7 days)
    const recentTrend = await this.getDailyCosts(organizationId, 7);
    
    return {
      currentMonth,
      lastMonth,
      budgetStatus,
      topModels,
      recentTrend
    };
  }
}

// Export singleton instance
export const costAnalyticsService = new CostAnalyticsService();
