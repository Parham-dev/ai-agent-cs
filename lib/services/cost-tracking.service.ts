/**
 * Cost Tracking Service (Facade)
 * Main entry point that combines all cost-related services
 * 
 * This facade provides a unified interface to:
 * - UsageTrackerService: Track API usage
 * - CostCalculatorService: Calculate costs
 * - CostAnalyticsService: Generate reports and analytics
 */

import { usageTrackerService, type OpenAIResponse, type EmbeddingResponse } from './usage-tracker.service';
import { costCalculatorService, type UsageCosts } from './cost-calculator.service';
import { costAnalyticsService, type DailyCosts, type CostBreakdown, type BudgetStatus } from './cost-analytics.service';

export class CostTrackingService {
  // Delegate to usage tracker
  async trackUsageFromResponse(
    organizationId: string,
    agentId: string | null,
    response: OpenAIResponse,
    source: string = 'chat',
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    return usageTrackerService.trackUsageFromResponse(organizationId, agentId, response, source, metadata);
  }

  async trackEmbeddingFromResponse(
    organizationId: string,
    response: EmbeddingResponse,
    source: string = 'embedding',
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    return usageTrackerService.trackEmbeddingFromResponse(organizationId, response, source, metadata);
  }

  async trackUsage(params: {
    organizationId: string;
    agentId?: string | null;
    model: string;
    inputTokens: number;
    outputTokens: number;
    source: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    return usageTrackerService.trackUsage(params);
  }

  async trackEmbeddingUsage(params: {
    organizationId: string;
    agentId?: string | null;
    model: string;
    tokens: number;
    source: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    return usageTrackerService.trackEmbeddingUsage(params);
  }

  // Delegate to cost calculator
  estimateMessageCost(model: string, estimatedInputTokens: number, estimatedOutputTokens: number): number {
    return costCalculatorService.estimateMessageCost(model, estimatedInputTokens, estimatedOutputTokens);
  }

  getModelPricing() {
    return costCalculatorService.getModelPricing();
  }

  // Delegate to cost analytics
  async getOrganizationCosts(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageCosts> {
    return costAnalyticsService.getOrganizationCosts(organizationId, startDate, endDate);
  }

  async getAgentCosts(
    agentId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageCosts> {
    return costAnalyticsService.getAgentCosts(agentId, startDate, endDate);
  }

  async getOrganizationCostBreakdown(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CostBreakdown> {
    return costAnalyticsService.getOrganizationCostBreakdown(organizationId, startDate, endDate);
  }

  async getDailyCosts(
    organizationId: string,
    days: number = 30
  ): Promise<DailyCosts[]> {
    return costAnalyticsService.getDailyCosts(organizationId, days);
  }

  async checkBudgetStatus(organizationId: string): Promise<BudgetStatus> {
    return costAnalyticsService.checkBudgetStatus(organizationId);
  }

  async getRecommendedModel(organizationId: string, estimatedTokens: number = 1000): Promise<string> {
    return costAnalyticsService.getRecommendedModel(organizationId, estimatedTokens);
  }

  async getCostSummary(organizationId: string) {
    return costAnalyticsService.getCostSummary(organizationId);
  }
}

// Export singleton instance for backward compatibility
export const costTrackingService = new CostTrackingService();

// Export individual services for direct access
export { usageTrackerService } from './usage-tracker.service';
export { costCalculatorService } from './cost-calculator.service';
export { costAnalyticsService } from './cost-analytics.service';

// Re-export types
export type { UsageCosts, DailyCosts, CostBreakdown, BudgetStatus, OpenAIResponse, EmbeddingResponse };
