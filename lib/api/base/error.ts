/**
 * API Error handling for all clients
 */

import { API_ERROR_CODES, type ApiErrorCode } from '@/lib/types';

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export { API_ERROR_CODES };