/**
 * Cost Calculator Service
 * Handles cost calculations for different OpenAI models
 * 
 * Responsibilities:
 * - Calculate costs based on token usage and model pricing
 * - Maintain pricing information for different models
 * - Provide cost estimation methods
 */

// OpenAI model pricing (as of July 2025 - should be configurable)
const MODEL_PRICING = {
  // GPT-4.1 models
  'gpt-4.1': {
    input: 0.002,          // $2.00 per 1M tokens
    output: 0.008,         // $8.00 per 1M tokens
  },
  'gpt-4.1-2025-04-14': {
    input: 0.002,          // $2.00 per 1M tokens
    output: 0.008,         // $8.00 per 1M tokens
  },
  'gpt-4.1-mini': {
    input: 0.0004,         // $0.40 per 1M tokens
    output: 0.0016,        // $1.60 per 1M tokens
  },
  'gpt-4.1-mini-2025-04-14': {
    input: 0.0004,         // $0.40 per 1M tokens
    output: 0.0016,        // $1.60 per 1M tokens
  },
  'gpt-4.1-nano': {
    input: 0.0001,         // $0.10 per 1M tokens
    output: 0.0004,        // $0.40 per 1M tokens
  },
  'gpt-4.1-nano-2025-04-14': {
    input: 0.0001,         // $0.10 per 1M tokens
    output: 0.0004,        // $0.40 per 1M tokens
  },
  'gpt-4.5-preview': {
    input: 0.075,          // $75.00 per 1M tokens
    output: 0.15,          // $150.00 per 1M tokens
  },
  'gpt-4.5-preview-2025-02-27': {
    input: 0.075,          // $75.00 per 1M tokens
    output: 0.15,          // $150.00 per 1M tokens
  },
  
  // GPT-4o models
  'gpt-4o': {
    input: 0.0025,         // $2.50 per 1M tokens
    output: 0.01,          // $10.00 per 1M tokens
  },
  'gpt-4o-2024-08-06': {
    input: 0.0025,         // $2.50 per 1M tokens
    output: 0.01,          // $10.00 per 1M tokens
  },
  'gpt-4o-audio-preview': {
    input: 0.0025,         // $2.50 per 1M tokens
    output: 0.01,          // $10.00 per 1M tokens
  },
  'gpt-4o-audio-preview-2024-12-17': {
    input: 0.0025,         // $2.50 per 1M tokens
    output: 0.01,          // $10.00 per 1M tokens
  },
  'gpt-4o-realtime-preview': {
    input: 0.005,          // $5.00 per 1M tokens
    output: 0.02,          // $20.00 per 1M tokens
  },
  'gpt-4o-realtime-preview-2025-06-03': {
    input: 0.005,          // $5.00 per 1M tokens
    output: 0.02,          // $20.00 per 1M tokens
  },
  'gpt-4o-search-preview': {
    input: 0.0025,         // $2.50 per 1M tokens
    output: 0.01,          // $10.00 per 1M tokens
  },
  'gpt-4o-search-preview-2025-03-11': {
    input: 0.0025,         // $2.50 per 1M tokens
    output: 0.01,          // $10.00 per 1M tokens
  },
  
  // GPT-4o mini models
  'gpt-4o-mini': {
    input: 0.00015,        // $0.15 per 1M tokens
    output: 0.0006,        // $0.60 per 1M tokens
  },
  'gpt-4o-mini-2024-07-18': {
    input: 0.00015,        // $0.15 per 1M tokens
    output: 0.0006,        // $0.60 per 1M tokens
  },
  'gpt-4o-mini-audio-preview': {
    input: 0.00015,        // $0.15 per 1M tokens
    output: 0.0006,        // $0.60 per 1M tokens
  },
  'gpt-4o-mini-audio-preview-2024-12-17': {
    input: 0.00015,        // $0.15 per 1M tokens
    output: 0.0006,        // $0.60 per 1M tokens
  },
  'gpt-4o-mini-realtime-preview': {
    input: 0.0006,         // $0.60 per 1M tokens
    output: 0.0024,        // $2.40 per 1M tokens
  },
  'gpt-4o-mini-realtime-preview-2024-12-17': {
    input: 0.0006,         // $0.60 per 1M tokens
    output: 0.0024,        // $2.40 per 1M tokens
  },
  'gpt-4o-mini-search-preview': {
    input: 0.00015,        // $0.15 per 1M tokens
    output: 0.0006,        // $0.60 per 1M tokens
  },
  'gpt-4o-mini-search-preview-2025-03-11': {
    input: 0.00015,        // $0.15 per 1M tokens
    output: 0.0006,        // $0.60 per 1M tokens
  },
  
  // o1 models
  'o1': {
    input: 0.015,          // $15.00 per 1M tokens
    output: 0.06,          // $60.00 per 1M tokens
  },
  'o1-2024-12-17': {
    input: 0.015,          // $15.00 per 1M tokens
    output: 0.06,          // $60.00 per 1M tokens
  },
  'o1-pro': {
    input: 0.15,           // $150.00 per 1M tokens
    output: 0.6,           // $600.00 per 1M tokens
  },
  'o1-pro-2025-03-19': {
    input: 0.15,           // $150.00 per 1M tokens
    output: 0.6,           // $600.00 per 1M tokens
  },
  'o1-mini': {
    input: 0.0011,         // $1.10 per 1M tokens
    output: 0.0044,        // $4.40 per 1M tokens
  },
  'o1-mini-2024-09-12': {
    input: 0.0011,         // $1.10 per 1M tokens
    output: 0.0044,        // $4.40 per 1M tokens
  },
  
  // o3 models
  'o3': {
    input: 0.002,          // $2.00 per 1M tokens
    output: 0.008,         // $8.00 per 1M tokens
  },
  'o3-2025-04-16': {
    input: 0.002,          // $2.00 per 1M tokens
    output: 0.008,         // $8.00 per 1M tokens
  },
  'o3-pro': {
    input: 0.02,           // $20.00 per 1M tokens
    output: 0.08,          // $80.00 per 1M tokens
  },
  'o3-pro-2025-06-10': {
    input: 0.02,           // $20.00 per 1M tokens
    output: 0.08,          // $80.00 per 1M tokens
  },
  'o3-deep-research': {
    input: 0.01,           // $10.00 per 1M tokens
    output: 0.04,          // $40.00 per 1M tokens
  },
  'o3-deep-research-2025-06-26': {
    input: 0.01,           // $10.00 per 1M tokens
    output: 0.04,          // $40.00 per 1M tokens
  },
  'o3-mini': {
    input: 0.0011,         // $1.10 per 1M tokens
    output: 0.0044,        // $4.40 per 1M tokens
  },
  'o3-mini-2025-01-31': {
    input: 0.0011,         // $1.10 per 1M tokens
    output: 0.0044,        // $4.40 per 1M tokens
  },
  
  // o4 models
  'o4-mini': {
    input: 0.0011,         // $1.10 per 1M tokens
    output: 0.0044,        // $4.40 per 1M tokens
  },
  'o4-mini-2025-04-16': {
    input: 0.0011,         // $1.10 per 1M tokens
    output: 0.0044,        // $4.40 per 1M tokens
  },
  'o4-mini-deep-research': {
    input: 0.002,          // $2.00 per 1M tokens
    output: 0.008,         // $8.00 per 1M tokens
  },
  'o4-mini-deep-research-2025-06-26': {
    input: 0.002,          // $2.00 per 1M tokens
    output: 0.008,         // $8.00 per 1M tokens
  },
  
  // Codex models
  'codex-mini-latest': {
    input: 0.0015,         // $1.50 per 1M tokens
    output: 0.006,         // $6.00 per 1M tokens
  },
  
  // Special models
  'computer-use-preview': {
    input: 0.003,          // $3.00 per 1M tokens
    output: 0.012,         // $12.00 per 1M tokens
  },
  'computer-use-preview-2025-03-11': {
    input: 0.003,          // $3.00 per 1M tokens
    output: 0.012,         // $12.00 per 1M tokens
  },
  
  // Embedding models
  'text-embedding-3-small': {
    input: 0.00002,        // $0.02 per 1M tokens
    output: 0,
  },
  'text-embedding-3-large': {
    input: 0.00013,        // $0.13 per 1M tokens
    output: 0,
  },
  'text-embedding-ada-002': {
    input: 0.0001,         // $0.10 per 1M tokens
    output: 0,
  },
  
  // Legacy aliases for backward compatibility
  'o1-preview': {
    input: 0.015,          // $15.00 per 1M tokens (same as o1)
    output: 0.06,          // $60.00 per 1M tokens
  },
} as const;

export interface UsageCosts {
  totalCost: number;
  inputCost: number;
  outputCost: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
}

export class CostCalculatorService {
  /**
   * Calculate costs for given model and token usage
   */
  calculateCosts(model: string, inputTokens: number, outputTokens: number): UsageCosts {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
    
    if (!pricing) {
      console.warn(`Unknown model pricing for: ${model}, using gpt-4o-mini as fallback`);
      const fallbackPricing = MODEL_PRICING['gpt-4o-mini'];
      const inputCost = inputTokens * fallbackPricing.input;
      const outputCost = outputTokens * fallbackPricing.output;
      
      return {
        totalCost: inputCost + outputCost,
        inputCost,
        outputCost,
        totalTokens: inputTokens + outputTokens,
        inputTokens,
        outputTokens
      };
    }

    const inputCost = inputTokens * pricing.input;
    const outputCost = outputTokens * pricing.output;

    return {
      totalCost: inputCost + outputCost,
      inputCost,
      outputCost,
      totalTokens: inputTokens + outputTokens,
      inputTokens,
      outputTokens
    };
  }

  /**
   * Get estimated cost for a message before sending
   */
  estimateMessageCost(model: string, estimatedInputTokens: number, estimatedOutputTokens: number): number {
    const costs = this.calculateCosts(model, estimatedInputTokens, estimatedOutputTokens);
    return costs.totalCost;
  }

  /**
   * Aggregate costs from usage records
   */
  aggregateCosts(records: Array<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
  }>): UsageCosts {
    return records.reduce(
      (acc, record) => ({
        totalCost: acc.totalCost + record.totalCost,
        inputCost: acc.inputCost + record.inputCost,
        outputCost: acc.outputCost + record.outputCost,
        totalTokens: acc.totalTokens + record.totalTokens,
        inputTokens: acc.inputTokens + record.promptTokens,
        outputTokens: acc.outputTokens + record.completionTokens
      }),
      {
        totalCost: 0,
        inputCost: 0,
        outputCost: 0,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0
      }
    );
  }

  /**
   * Get model pricing information
   */
  getModelPricing() {
    return MODEL_PRICING;
  }

  /**
   * Check if a model exists in pricing
   */
  isModelSupported(model: string): boolean {
    return model in MODEL_PRICING;
  }

  /**
   * Get all supported models
   */
  getSupportedModels(): string[] {
    return Object.keys(MODEL_PRICING);
  }

  /**
   * Get available models for wizard dropdown selection
   * Returns the main models that users should choose from for their agents
   */
  getAvailableModels(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'gpt-4.1',
        label: 'GPT-4.1',
        description: 'Latest GPT-4.1 model with enhanced capabilities'
      },
      {
        value: 'gpt-4.1-mini',
        label: 'GPT-4.1 Mini',
        description: 'Smaller, faster version of GPT-4.1'
      },
      {
        value: 'gpt-4.5-preview',
        label: 'GPT-4.5 Preview',
        description: 'Most advanced model with premium capabilities'
      },
      {
        value: 'gpt-4o',
        label: 'GPT-4o',
        description: 'Multimodal model optimized for chat and reasoning'
      },
      {
        value: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        description: 'Fast and cost-effective multimodal model'
      },
      {
        value: 'o3',
        label: 'o3',
        description: 'Advanced reasoning model for complex tasks'
      },
      {
        value: 'o3-pro',
        label: 'o3 Pro',
        description: 'Professional-grade reasoning model'
      },
      {
        value: 'o3-mini',
        label: 'o3 Mini',
        description: 'Compact reasoning model for everyday use'
      },
      {
        value: 'o4-mini',
        label: 'o4 Mini',
        description: 'Next-generation compact reasoning model'
      }
    ];
  }
}

// Export singleton instance
export const costCalculatorService = new CostCalculatorService();
