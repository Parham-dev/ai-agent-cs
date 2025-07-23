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
import { organizationCreditsService } from '@/lib/database/services/organization-credits.service';
import { creditTransactionsService } from '@/lib/database/services/credit-transactions.service';
import type { CreateUsageRecordData } from '@/lib/types/database';
import { CostCalculatorService } from './cost-calculator.service';
import { userPricingService } from './user-pricing.service';
import { logger } from '@/lib/utils/logger';

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
        logger.warn('No usage data in OpenAI response');
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
      logger.error('Failed to track usage from response', {}, error as Error);
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
        logger.warn('No usage data in embedding response');
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
      logger.error('Failed to track embedding usage', {}, error as Error);
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
    conversationId?: string; // Add explicit conversationId parameter
  }): Promise<void> {
    try {
      const { organizationId, agentId, model, inputTokens, outputTokens, source, metadata = {}, conversationId } = params;
      
      // Extract conversationId from metadata if not provided directly
      const finalConversationId = conversationId || (metadata.conversationId as string | undefined);
      
      // Calculate costs
      const costs = this.costCalculator.calculateCosts(model, inputTokens, outputTokens);
      const userCost = userPricingService.calculateUserCost(costs.totalCost);
      
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
        userCost,
        source,
        conversationId: finalConversationId, // Extract conversationId from metadata
        metadata
      };

      const usageRecord = await usageRecordsService.createUsageRecord(usageData);

      // Deduct credits from organization
      try {
        await organizationCreditsService.deductCredits(organizationId, userCost);
        
        // Create credit transaction for the deduction
        await creditTransactionsService.createUsageDeduction({
          organizationId,
          amount: userCost,
          usageRecordId: usageRecord.id,
          conversationId: finalConversationId,
          agentId: agentId || undefined,
          model,
          description: `${model} API usage - ${inputTokens + outputTokens} tokens`
        });
      } catch (creditError) {
        logger.error('Failed to deduct credits', {
          organizationId,
          userCost,
          usageRecordId: usageRecord.id
        }, creditError as Error);
        // Don't throw - we still want to track usage even if credit deduction fails
      }
    } catch (error) {
      logger.error('Failed to track usage', {
        organizationId: params.organizationId,
        agentId: params.agentId || undefined,
        model: params.model,
        source: params.source
      }, error as Error);
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
      const userCost = userPricingService.calculateUserCost(costs.totalCost);
      
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
        userCost,
        source,
        metadata
      };

      const usageRecord = await usageRecordsService.createUsageRecord(usageData);

      // Deduct credits from organization
      try {
        await organizationCreditsService.deductCredits(organizationId, userCost);
        
        // Create credit transaction for the deduction
        await creditTransactionsService.createUsageDeduction({
          organizationId,
          amount: userCost,
          usageRecordId: usageRecord.id,
          model,
          description: `${model} embedding - ${tokens} tokens`
        });
      } catch (creditError) {
        logger.error('Failed to deduct credits for embedding', {
          organizationId,
          userCost,
          usageRecordId: usageRecord.id
        }, creditError as Error);
        // Don't throw - we still want to track usage even if credit deduction fails
      }
    } catch (error) {
      logger.error('Failed to track embedding usage', {
        organizationId: params.organizationId,
        agentId: params.agentId || undefined,
        model: params.model,
        source: params.source
      }, error as Error);
    }
  }
}

// Export singleton instance
export const usageTrackerService = new UsageTrackerService();
