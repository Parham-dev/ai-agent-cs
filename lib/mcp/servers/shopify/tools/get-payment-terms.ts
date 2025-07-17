import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { 
  MCPToolContext, 
  MCPToolResponse,
  ShopifyPaymentTerm
} from '../types';

interface GetPaymentTermsParams {
  limit?: number;
}

export const getPaymentTermsTool = {
  name: 'getPaymentTerms',
  description: 'Get payment terms configured for the store',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of payment terms to return (1-250)',
        minimum: 1,
        maximum: 250,
        default: 50
      }
    },
    required: []
  },

  async handler(
    params: GetPaymentTermsParams,
    context: MCPToolContext
  ): Promise<MCPToolResponse<{ paymentTerms: ShopifyPaymentTerm[] }>> {
    const startTime = Date.now();
    
    try {
      const client = new ShopifyMCPClient(context.credentials, context.settings);
      const paymentTerms = await client.getPaymentTerms(params.limit || 50);

      return {
        success: true,
        data: { paymentTerms },
        metadata: {
          requestId: context.requestId,
          timestamp: context.timestamp,
          executionTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('Get payment terms tool failed', { requestId: context.requestId }, error as Error);
      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: {
          code: (errorObj.code as string) || 'GET_PAYMENT_TERMS_ERROR',
          message: (errorObj.message as string) || 'Failed to get payment terms',
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