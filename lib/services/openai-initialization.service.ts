/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { setDefaultOpenAIKey, addTraceProcessor, getGlobalTraceProvider } from '@openai/agents';
import type { TracingProcessor, Span, Trace } from '@openai/agents';
import { costTrackingService } from './cost-tracking.service';

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
      console.error('❌ Error in cost tracking trace processor:', error);
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

    console.log('🔍 Generation span detected:', {
      spanId: span.spanId,
      hasUsage: !!usage,
      hasModel: !!spanData.model,
      model: spanData.model,
      usage: usage,
      spanDataKeys: Object.keys(spanData || {}),
    });

    if (!usage || !spanData.model) {
      console.warn('⚠️  No usage data or model found in generation span');
      return;
    }

    // Extract context from span - try to get organizationId from trace metadata
    let organizationId = this.extractOrganizationId(span);
    if (!organizationId) {
      console.warn('⚠️  No organizationId found in span context');
      // TEMPORARY: Use a default organizationId for testing
      // TODO: Figure out how to properly extract organizationId from context
      organizationId = 'test-org-id';
      console.warn('🔧 Using temporary organizationId for testing:', organizationId);
    }

    console.log('✅ Tracking usage:', {
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

    console.debug(`Cost tracking: ${spanData.model} - ${usage.prompt_tokens}/${usage.completion_tokens} tokens`);
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

    // For now, log what we have available for debugging
    console.warn('🔍 Unable to extract organizationId. Available data:', {
      spanId: span.spanId,
      traceId: span.traceId,
      spanDataKeys: Object.keys(spanData || {}),
      hasInputContext: !!spanData?._input?.context,
      inputContextKeys: spanData?._input?.context ? Object.keys(spanData._input.context) : [],
      spanData: JSON.stringify(spanData, null, 2),
    });

    return null;
  }

  private async handleResponseSpan(span: Span<any>): Promise<void> {
    const spanData = span.spanData;
    const response = spanData?._response;
    
    if (response && typeof response === 'object' && response.usage && response.model) {
      const usage = response.usage;
      const context = getCurrentContext();
      
      // Get organization ID from span or global context
      const organizationId = this.extractOrganizationId(span) || context.organizationId;
      if (!organizationId) {
        console.warn('⚠️ No organizationId available for cost tracking');
        return;
      }

      // Validate that we have essential context for proper cost tracking
      if (!context.agentId) {
        console.warn('⚠️ No agentId available for cost tracking - this may indicate a context propagation issue');
      }

      if (!context.conversationId) {
        console.warn('⚠️ No conversationId available for cost tracking - costs will not be linked to specific conversations');
        console.debug('Current context:', context);
        console.debug('Span data keys:', Object.keys(spanData || {}));
      }

      // Extract token counts - handle different formats
      const inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
      const outputTokens = usage.output_tokens || usage.completion_tokens || 0;

      // Validate token counts
      if (inputTokens === 0 && outputTokens === 0) {
        console.warn('⚠️ Both input and output tokens are 0 - this may indicate a usage extraction issue');
        console.debug('Raw usage data:', usage);
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

      // Log successful cost tracking for debugging
      console.debug('✅ Cost tracking completed:', {
        organizationId,
        agentId: context.agentId,
        conversationId: context.conversationId,
        model: response.model,
        inputTokens,
        outputTokens,
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
    console.warn('OPENAI_API_KEY not found in environment variables');
  }

  // Add cost tracking processor
  const costProcessor = new CostTrackingTraceProcessor();
  addTraceProcessor(costProcessor);

  console.log('OpenAI Agents SDK initialized with cost tracking');
}

// Use AsyncLocalStorage for request-scoped context (Node.js 14+)
import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  organizationId: string;
  agentId: string;
  conversationId?: string;
}

// Request-scoped context storage
const contextStorage = new AsyncLocalStorage<RequestContext>();

// Function to run code within a request context
export function runInContext<T>(
  context: RequestContext, 
  fn: () => Promise<T>
): Promise<T> {
  return contextStorage.run(context, fn);
}

// Function to set the current context before agent runs (backward compatibility)
export function setCurrentContext(context: {
  organizationId: string;
  agentId: string;
  conversationId?: string;
}): void {
  // For backward compatibility, we'll store in the current async context if available
  const currentRequestContext = contextStorage.getStore();
  if (currentRequestContext) {
    Object.assign(currentRequestContext, context);
  } else {
    // Fallback: store in a Map keyed by request ID (if we can identify the request)
    console.warn('⚠️ setCurrentContext called outside of request context');
  }
}

// Function to get the current organization ID
export function getCurrentOrganizationId(): string | null {
  const context = contextStorage.getStore();
  return context?.organizationId || null;
}

// Function to get the current context
export function getCurrentContext(): {
  organizationId: string | null;
  agentId: string | null;
  conversationId: string | null;
} {
  const context = contextStorage.getStore();
  return {
    organizationId: context?.organizationId || null,
    agentId: context?.agentId || null,
    conversationId: context?.conversationId || null,
  };
}

// Auto-initialize when this module is imported
initializeOpenAIAgents();

// Export trace provider for manual flushing
export { getGlobalTraceProvider };