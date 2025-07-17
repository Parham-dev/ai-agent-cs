import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  MCPToolContext, 
  MCPToolResponse,
  ShopifyPage
} from '../types';

interface GetPagesParams {
  limit?: number;
}

export const getPagesTool = {
  name: 'getPages',
  description: 'Get online store pages (about, contact, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of pages to return (1-250)',
        minimum: 1,
        maximum: 250,
        default: 50
      }
    },
    required: []
  },

  async handler(
    params: GetPagesParams,
    context: MCPToolContext
  ): Promise<MCPToolResponse<{ pages: ShopifyPage[] }>> {
    const startTime = Date.now();
    
    try {
      const client = new ShopifyMCPClient(context.credentials, context.settings);
      const pages = await client.getPages(params.limit || 50);

      return {
        success: true,
        data: { pages },
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('Get pages tool failed', { requestId: context.requestId }, error as Error);
      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'GET_PAGES_ERROR',
          message: (errorObj.message as string) || 'Failed to get pages',
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