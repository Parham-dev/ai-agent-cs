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

/**
 * Smart error handler with automatic error type detection and appropriate responses
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<NextResponse | R> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle custom application errors
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          return ApiResponseHelper.error('NOT_FOUND', error.message);
        }
        
        if (error.name === 'ValidationError') {
          return ApiResponseHelper.error('VALIDATION_ERROR', error.message);
        }
        
        if (error.name === 'DatabaseError') {
          return ApiResponseHelper.error('DATABASE_ERROR', 'Database operation failed', {
            operation: error.cause || 'unknown'
          });
        }
      }
      
      // Handle Prisma specific errors
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; meta?: { target?: string[] } };
        
        switch (prismaError.code) {
          case 'P2002':
            return ApiResponseHelper.error('CONFLICT', 'Resource already exists', {
              field: prismaError.meta?.target
            });
          case 'P2025':
            return ApiResponseHelper.error('NOT_FOUND', 'Resource not found');
          case 'P2003':
            return ApiResponseHelper.error('VALIDATION_ERROR', 'Foreign key constraint failed');
          default:
            return ApiResponseHelper.error('DATABASE_ERROR', 'Database operation failed');
        }
      }
      
      // Handle validation errors (from Zod or similar)
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ path: string[]; message: string }> };
        const validationErrors = zodError.issues.reduce((acc: Record<string, string>, issue) => {
          const path = issue.path.join('.');
          acc[path] = issue.message;
          return acc;
        }, {});
        
        return ApiResponseHelper.validationError(validationErrors);
      }
      
      // Handle network/external API errors
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          return ApiResponseHelper.error('EXTERNAL_API_ERROR', 'External service unavailable');
        }
        
        if (error.message.includes('timeout')) {
          return ApiResponseHelper.error('EXTERNAL_API_ERROR', 'Request timeout');
        }
      }
      
      // Generic internal error
      return ApiResponseHelper.internalError();
    }
  };
}
