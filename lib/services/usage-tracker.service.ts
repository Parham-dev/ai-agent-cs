/**
 * Usage Tracker Service
 * Handles recording and tracking of OpenAI API usage
 * 
 * Responsibilities:
 * - Track usage from OpenAI responses
 * - Record manual usage entries
 * - Handle embedding usage tracking
 */

import { usageRecordsService } from '@/lib/database/services/usage-records.service';
import type { CreateUsageRecordData } from '@/lib/types/database';
import { CostCalculatorService } from './cost-calculator.service';

export interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAIResponse {
  usage?: OpenAIUsage;
  model?: string;
}

export interface EmbeddingUsage {
  prompt_tokens: number;
  total_tokens: number;
}

export interface EmbeddingResponse {
  usage?: EmbeddingUsage;
  model?: string;
}

export class UsageTrackerService {
  private costCalculator = new CostCalculatorService();

  /**
   * Track usage from OpenAI API response
   */
  async trackUsageFromResponse(
    organizationId: string,
    agentId: string | null,
    response: OpenAIResponse,
    source: string = 'chat',
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      if (!response.usage || !response.model) {
        console.warn('No usage data in OpenAI response');
        return;
      }

      const { prompt_tokens, completion_tokens } = response.usage;
      const model = response.model;

      await this.trackUsage({
        organizationId,
        agentId,
        model,
        inputTokens: prompt_tokens,
        outputTokens: completion_tokens,
        source,
        metadata
      });
    } catch (error) {
      console.error('Failed to track usage from response:', error);
      // Don't throw - usage tracking shouldn't break the main flow
    }
  }

  /**
   * Track embedding usage from OpenAI response
   */
  async trackEmbeddingFromResponse(
    organizationId: string,
    response: EmbeddingResponse,
    source: string = 'embedding',
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      if (!response.usage || !response.model) {
        console.warn('No usage data in embedding response');
        return;
      }

      const { total_tokens } = response.usage;
      const model = response.model;

      await this.trackEmbeddingUsage({
        organizationId,
        model,
        tokens: total_tokens,
        source,
        metadata
      });
    } catch (error) {
      console.error('Failed to track embedding usage:', error);
    }
  }

  /**
   * Track usage manually
   */
  async trackUsage(params: {
    organizationId: string;
    agentId?: string | null;
    model: string;
    inputTokens: number;
    outputTokens: number;
    source: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const { organizationId, agentId, model, inputTokens, outputTokens, source, metadata = {} } = params;
      
      // Calculate costs
      const costs = this.costCalculator.calculateCosts(model, inputTokens, outputTokens);
      
      // Create usage record
      const usageData: CreateUsageRecordData = {
        organizationId,
        agentId: agentId || undefined,
        model,
        operation: 'completion',
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
        inputCost: costs.inputCost,
        outputCost: costs.outputCost,
        totalCost: costs.totalCost,
        source,
        metadata
      };

      await usageRecordsService.createUsageRecord(usageData);
    } catch (error) {
      console.error('Failed to track usage:', error);
      // Don't throw - usage tracking shouldn't break the main flow
    }
  }

  /**
   * Track embedding usage manually
   */
  async trackEmbeddingUsage(params: {
    organizationId: string;
    agentId?: string | null;
    model: string;
    tokens: number;
    source: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const { organizationId, agentId, model, tokens, source, metadata = {} } = params;
      
      // For embeddings, all tokens are input tokens
      const costs = this.costCalculator.calculateCosts(model, tokens, 0);
      
      const usageData: CreateUsageRecordData = {
        organizationId,
        agentId: agentId || undefined,
        model,
        operation: 'embedding',
        promptTokens: tokens,
        completionTokens: 0,
        totalTokens: tokens,
        inputCost: costs.inputCost,
        outputCost: 0,
        totalCost: costs.totalCost,
        source,
        metadata
      };

      await usageRecordsService.createUsageRecord(usageData);
    } catch (error) {
      console.error('Failed to track embedding usage:', error);
    }
  }
}

// Export singleton instance
export const usageTrackerService = new UsageTrackerService();
