/**
 * Base Tool Factory for Shopify Tools
 * Eliminates 90% duplicate code across 13 tools
 */

import { logger } from '@/lib/utils/logger';
import { ShopifyMCPClient } from '../client';
import { MCPToolContext, MCPToolResponse } from '../types';

export interface BaseToolConfig<TParams = Record<string, unknown>, TData = unknown> {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
  handler: (client: ShopifyMCPClient, params: TParams) => Promise<TData>;
  validateParams?: (params: TParams) => string | null;
  formatResponse?: (data: unknown) => TData;
}

/**
 * Creates a standardized Shopify tool with error handling, logging, and timing
 */
export function createShopifyTool<TParams = Record<string, unknown>, TData = unknown>(
  config: BaseToolConfig<TParams, TData>
) {
  return {
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,

    async handler(
      params: TParams,
      context: MCPToolContext
    ): Promise<MCPToolResponse<TData>> {
      const startTime = Date.now();
      
      try {
        logger.debug(`${config.name} tool called`, { 
          requestId: context.requestId,
          ...params
        });

        // Validate parameters if validator provided
        if (config.validateParams) {
          const validationError = config.validateParams(params);
          if (validationError) {
            return {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: validationError
              },
              metadata: {
                requestId: context.requestId,
                timestamp: context.timestamp,
                executionTime: Date.now() - startTime
              }
            };
          }
        }

        // Initialize Shopify client
        const client = new ShopifyMCPClient(context.credentials, context.settings);

        // Execute tool handler
        const data = await config.handler(client, params);

        // Format response if formatter provided
        const finalData = config.formatResponse ? config.formatResponse(data) : data;

        logger.info(`${config.name} completed successfully`, {
          requestId: context.requestId,
          executionTime: Date.now() - startTime
        });

        return {
          success: true,
          data: finalData,
          metadata: {
            requestId: context.requestId,
            timestamp: context.timestamp,
            executionTime: Date.now() - startTime
          }
        };

      } catch (error) {
        logger.error(`${config.name} tool failed`, {
          requestId: context.requestId,
          ...params
        }, error as Error);

        const errorObj = error as Record<string, unknown>;
        return {
          success: false,
          error: {
            code: (errorObj.code as string) || `${config.name.toUpperCase()}_ERROR`,
            message: (errorObj.message as string) || `Failed to execute ${config.name}`,
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
}

/**
 * Common validation helpers
 */
export const validators = {
  limit: (limit: unknown): string | null => {
    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 1 || limit > 250) {
        return 'Limit must be a number between 1 and 250';
      }
    }
    return null;
  },

  status: (status: unknown): string | null => {
    if (status !== undefined) {
      if (typeof status !== 'string') {
        return 'Status must be a string';
      }
      const validStatuses = ['active', 'archived', 'draft'];
      if (!validStatuses.includes(status)) {
        return `Status must be one of: ${validStatuses.join(', ')}`;
      }
    }
    return null;
  },

  required: (value: unknown, fieldName: string): string | null => {
    if (!value) {
      return `${fieldName} is required`;
    }
    return null;
  }
};