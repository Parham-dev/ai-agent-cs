/**
 * API Utilities - Unified response handling and helpers
 * Import specific items for better tree-shaking and clearer dependencies
 */

export * from './helpers';
export * from './client';
export * from './route-utils';
export * from './error-handling';

// Re-export commonly used items for convenience
export { ApiResponseHelper as Api } from './helpers';
export { API_ERROR_CODES as ErrorCodes } from '@/lib/types';
