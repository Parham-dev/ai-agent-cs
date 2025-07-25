/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { setDefaultOpenAIKey, addTraceProcessor, getGlobalTraceProvider } from '@openai/agents';
import type { TracingProcessor, Span, Trace } from '@openai/agents';
import { costTrackingService } from './cost-tracking.service';
import { logger } from '@/lib/utils/logger';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  organizationId: string;
  agentId: string;
  conversationId?: string;
}

// Simple AsyncLocalStorage for Node.js runtime
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

interface SpanData {
  type: string;
  [key: string]: unknown;
}

interface GenerationSpanData extends SpanData {
  type: 'generation';
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

class CostTrackingTraceProcessor implements TracingProcessor {
  async onTraceStart(_trace: Trace): Promise<void> {
    // No action needed on trace start
  }

  async onTraceEnd(_trace: Trace): Promise<void> {
    // No action needed on trace end
  }

  async onSpanStart(_span: Span<any>): Promise<void> {
    // No action needed on span start
  }

  async onSpanEnd(span: Span<any>): Promise<void> {
    try {
      // Check for usage data in any span type
      if (span.spanData?.type === 'generation') {
        await this.handleGenerationSpan(span as Span<GenerationSpanData>);
      } else if (span.spanData?.type === 'response') {
        await this.handleResponseSpan(span);
      }
    } catch (error) {
      logger.error('Error in cost tracking trace processor', {}, error as Error);
      // Don't throw - tracing should not break the main flow
    }
  }

  async shutdown(_timeout?: number): Promise<void> {
    // Cleanup if needed
  }

  async forceFlush(): Promise<void> {
    // Force flush if needed
  }

  private async handleGenerationSpan(span: Span<GenerationSpanData>): Promise<void> {
    const spanData = span.spanData;
    const usage = spanData.usage;

    logger.debug('Generation span detected', {
      spanId: span.spanId,
      hasUsage: !!usage,
      hasModel: !!spanData.model,
      model: spanData.model,
    });

    if (!usage || !spanData.model) {
      logger.warn('No usage data or model found in generation span', { spanId: span.spanId });
      return;
    }

    // Extract context from span - try to get organizationId from trace metadata
    let organizationId = this.extractOrganizationId(span);
    if (!organizationId) {
      // Try to get from the new context system
      const currentContext = getCurrentContext();
      organizationId = currentContext.organizationId;
      
      if (!organizationId) {
        logger.warn('No organizationId found in span context or request context');
        return; // Skip tracking if no organization context available
      }
    }

    logger.info('Tracking usage from generation span', {
      organizationId,
      model: spanData.model,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
    });

    // Track usage through existing cost tracking service
    await costTrackingService.trackUsage({
      organizationId,
      model: spanData.model,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      source: 'agents-sdk',
      metadata: {
        spanId: span.spanId,
        traceId: span.traceId,
        parentId: span.parentId,
        startedAt: span.startedAt,
        endedAt: span.endedAt,
      },
    });

    logger.debug('Cost tracking completed for generation span', {
      model: spanData.model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens
    });
  }

  private extractOrganizationId(span: Span<any>): string | null {
    // Try to extract organizationId from various possible locations in the span
    // The @openai/agents SDK may store context in different places
    
    // Check if there's context in the span data
    const spanData = span.spanData as any;
    if (spanData?.context?.organizationId) {
      return spanData.context.organizationId as string;
    }

    // Check input context (for agent runs)
    if (spanData?._input?.context?.organizationId) {
      return spanData._input.context.organizationId as string;
    }

    // Check trace metadata if available  
    const spanWithTrace = span as any;
    const trace = spanWithTrace.trace;
    const metadata = trace?.metadata;
    if (metadata?.organizationId && typeof metadata.organizationId === 'string') {
      return metadata.organizationId;
    }

    // Log minimal data for debugging (removed verbose spanData dump)
    logger.debug('Unable to extract organizationId from span', {
      spanId: span.spanId,
      traceId: span.traceId,
      hasInputContext: !!spanData?._input?.context,
    });

    return null;
  }

  private async handleResponseSpan(span: Span<any>): Promise<void> {
    const spanData = span.spanData;
    const response = spanData?._response;
    
    if (response && typeof response === 'object' && response.usage && response.model) {
      const usage = response.usage;
      const context = getCurrentContext();
      
      // Get organization ID from span or request context
      let organizationId = this.extractOrganizationId(span) || context.organizationId;
      if (!organizationId) {
        // Try to get from the new context system
        const currentContext = getCurrentContext();
        organizationId = currentContext.organizationId;
        
        if (!organizationId) {
          logger.warn('No organizationId available for cost tracking');
          return;
        }
      }

      // Validate that we have essential context for proper cost tracking
      if (!context.agentId) {
        logger.warn('No agentId available for cost tracking - this may indicate a context propagation issue');
      }

      if (!context.conversationId) {
        logger.warn('No conversationId available for cost tracking - costs will not be linked to specific conversations');
      }

      // Extract token counts - handle different formats
      const inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
      const outputTokens = usage.output_tokens || usage.completion_tokens || 0;

      // Validate token counts
      if (inputTokens === 0 && outputTokens === 0) {
        logger.warn('Both input and output tokens are 0 - this may indicate a usage extraction issue', {
          model: response.model,
          spanId: span.spanId
        });
      }

      // Track usage through existing cost tracking service
      await costTrackingService.trackUsage({
        organizationId,
        agentId: context.agentId || undefined,
        model: response.model,
        inputTokens,
        outputTokens,
        source: 'agents-sdk-response',
        conversationId: context.conversationId || undefined, // Pass conversationId directly
        metadata: {
          spanId: span.spanId,
          traceId: span.traceId,
          spanType: 'response',
          parentId: span.parentId,
          startedAt: span.startedAt,
          endedAt: span.endedAt,
          // Add validation metadata for debugging
          contextValidation: {
            hasOrganizationId: !!organizationId,
            hasAgentId: !!context.agentId,
            hasConversationId: !!context.conversationId,
            inputTokens,
            outputTokens,
          }
        },
      });

      // Log successful cost tracking (only essential info)
      logger.info('Cost tracking completed', {
        model: response.model,
        inputTokens,
        outputTokens,
        hasConversationId: !!context.conversationId,
        spanId: span.spanId,
      });
    }
  }
}

// Initialize OpenAI Agents SDK
function initializeOpenAIAgents(): void {
  // Set API key
  if (process.env.OPENAI_API_KEY) {
    setDefaultOpenAIKey(process.env.OPENAI_API_KEY);
  } else {
    logger.warn('OPENAI_API_KEY not found in environment variables');
  }

  // Add cost tracking processor
  const costProcessor = new CostTrackingTraceProcessor();
  addTraceProcessor(costProcessor);

  logger.info('OpenAI Agents SDK initialized with cost tracking');
}

/**
 * Run code within a request context using AsyncLocalStorage
 */
export function runInContext<T>(
  context: RequestContext, 
  fn: () => Promise<T>
): Promise<T> {
  return requestContextStorage.run(context, fn);
}

/**
 * Get the current request context
 */
export function getCurrentContext(): {
  organizationId: string | null;
  agentId: string | null;
  conversationId: string | null;
} {
  const context = requestContextStorage.getStore();
  return {
    organizationId: context?.organizationId || null,
    agentId: context?.agentId || null,
    conversationId: context?.conversationId || null,
  };
}

/**
 * Get current organization ID
 */
export function getCurrentOrganizationId(): string | null {
  return getCurrentContext().organizationId;
}

/**
 * Set current context (updates existing context in store)
 */
export function setCurrentContext(newContext: {
  organizationId: string;
  agentId: string;
  conversationId?: string;
}): void {
  const context = requestContextStorage.getStore();
  if (context) {
    Object.assign(context, newContext);
  }
}

// Auto-initialize when this module is imported
initializeOpenAIAgents();

// Export trace provider for manual flushing
export { getGlobalTraceProvider };