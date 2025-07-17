import { NextResponse } from 'next/server';
import { 
  ApiResponse, 
  ApiErrorCode, 
  ERROR_STATUS_MAPPING, 
  API_ERROR_CODES,
  PaginatedResponse 
} from '@/lib/types';

/**
 * API Response Helpers
 * Centralized functions for creating consistent API responses
 */

export class ApiResponseHelper {
  /**
   * Create a successful response
   */
  static success<T>(
    data: T, 
    metadata?: Record<string, unknown>,
    status: number = 200
  ): NextResponse {
    const response: ApiResponse<T> = {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Create an error response
   */
  static error(
    code: ApiErrorCode,
    message: string,
    details?: unknown,
    customStatus?: number
  ): NextResponse {
    const status = customStatus || ERROR_STATUS_MAPPING[code] || 500;
    
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
    metadata?: Record<string, unknown>
  ): NextResponse {
    const totalPages = Math.ceil(total / limit);
    
    const paginatedData: PaginatedResponse<T> = {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return this.success(paginatedData, metadata);
  }

  /**
   * Handle validation errors from Zod or similar
   */
  static validationError(errors: Record<string, string | undefined>): NextResponse {
    return this.error(
      API_ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      errors
    );
  }

  /**
   * Handle not found errors
   */
  static notFound(resource: string, id?: string): NextResponse {
    const message = id 
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    
    return this.error(API_ERROR_CODES.NOT_FOUND, message);
  }

  /**
   * Handle internal server errors
   */
  static internalError(message: string = 'Internal server error', details?: unknown): NextResponse {
    return this.error(API_ERROR_CODES.INTERNAL_ERROR, message, details);
  }

  /**
   * Handle database errors
   */
  static databaseError(operation: string, details?: unknown): NextResponse {
    return this.error(
      API_ERROR_CODES.DATABASE_ERROR,
      `Database error during ${operation}`,
      details
    );
  }

  /**
   * Handle external API errors
   */
  static externalApiError(service: string, details?: unknown): NextResponse {
    return this.error(
      API_ERROR_CODES.EXTERNAL_API_ERROR,
      `External API error: ${service}`,
      details
    );
  }
}

/**
 * Error handling wrapper for API routes
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<NextResponse | R> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        // Database connection errors
        if (error.message.includes('database') || error.message.includes('Prisma')) {
          return ApiResponseHelper.databaseError('operation', error.message);
        }
        
        // Rate limiting errors
        if (error.message.includes('rate limit')) {
          return ApiResponseHelper.error(
            API_ERROR_CODES.RATE_LIMITED,
            'Rate limit exceeded. Please try again later.',
            { retryAfter: 60 }
          );
        }
        
        // External API errors
        if (error.message.includes('API key') || error.message.includes('OpenAI')) {
          return ApiResponseHelper.externalApiError('OpenAI', error.message);
        }
      }
      
      // Generic internal error
      return ApiResponseHelper.internalError();
    }
  };
}

/**
 * Request validation helper
 */
export async function validateRequest<T>(
  request: Request,
  schema: { parse: (data: unknown) => T }
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch {
    return { 
      error: ApiResponseHelper.validationError({ request: 'Invalid request format' }) 
    };
  }
}

/**
 * Method validation helper
 */
export function validateMethod(request: Request, allowedMethods: string[]): NextResponse | null {
  if (!allowedMethods.includes(request.method || '')) {
    return ApiResponseHelper.error(
      API_ERROR_CODES.VALIDATION_ERROR,
      `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`
    );
  }
  return null;
}
