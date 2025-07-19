/**
 * Unified Error Handling Utilities
 * Consolidates error patterns used across 70+ files
 */

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Creates standardized success response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data
  };
}

/**
 * Creates standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): ApiResponse {
  return {
    success: false,
    error: {
      message,
      statusCode,
      code,
      details
    }
  };
}

/**
 * Handles and formats errors consistently
 */
export function handleError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      message: error.message,
      details: error.stack
    };
  }
  
  if (typeof error === 'string') {
    return { message: error };
  }
  
  return { message: 'An unknown error occurred' };
}

/**
 * Try-catch wrapper with consistent error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: ApiError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: handleError(error) };
  }
}

/**
 * Validation helper
 */
export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (!data[field]) {
      return `${field} is required`;
    }
  }
  return null;
}