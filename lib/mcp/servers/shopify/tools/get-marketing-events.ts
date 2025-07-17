import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  MCPToolContext, 
  MCPToolResponse,
  ShopifyMarketingEvent
} from '../types';

interface GetMarketingEventsParams {
  limit?: number;
}

/**
 * Get Marketing Events Tool
 * Gets marketing events and campaigns for the store
 */
export const getMarketingEventsTool = {
  name: 'getMarketingEvents',
  description: 'Get marketing events and campaigns for the store',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of events to return (1-250)',
        minimum: 1,
        maximum: 250,
        default: 50
      }
    },
    required: []
  },

  async handler(
    params: GetMarketingEventsParams,
    context: MCPToolContext
  ): Promise<MCPToolResponse<{ marketingEvents: ShopifyMarketingEvent[] }>> {
    const startTime = Date.now();
    
    try {
      logger.debug('Get marketing events tool called', { 
        requestId: context.requestId,
        limit: params.limit
      });

      // Initialize Shopify client
      const client = new ShopifyMCPClient(context.credentials, context.settings);

      // Get marketing events
      const marketingEvents = await client.getMarketingEvents(params.limit || 50);

      logger.info('Get marketing events completed successfully', {
        requestId: context.requestId,
        eventCount: marketingEvents.length,
        executionTime: Date.now() - startTime
      });

      return {
        success: true,
        data: { marketingEvents },
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('Get marketing events tool failed', {
        requestId: context.requestId,
        limit: params.limit
      }, error as Error);

      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'GET_MARKETING_EVENTS_ERROR',
          message: (errorObj.message as string) || 'Failed to get marketing events',
          details: errorObj.context
        },
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };
    }
  }
};