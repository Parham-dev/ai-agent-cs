import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  MCPToolContext, 
  MCPToolResponse,
  ShopifyLocale
} from '../types';

export const getLocalesTool = {
  name: 'getLocales',
  description: 'Get available locales/languages for the store',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  },

  async handler(
    params: Record<string, unknown>,
    context: MCPToolContext
  ): Promise<MCPToolResponse<{ locales: ShopifyLocale[] }>> {
    const startTime = Date.now();
    
    try {
      const client = new ShopifyMCPClient(context.credentials, context.settings);
      const locales = await client.getLocales();

      return {
        success: true,
        data: { locales },
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('Get locales tool failed', { requestId: context.requestId }, error as Error);
      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'GET_LOCALES_ERROR',
          message: (errorObj.message as string) || 'Failed to get locales',
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