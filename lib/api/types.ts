/**
 * Unified API Response Types and Interfaces
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ChatResponse {
  message: string;
  metadata: {
    model: string;
    agentName: string;
    toolsUsed?: string[];
    tokensUsed?: number;
    finishReason?: string;
    responseTime?: number;
  };
}

// Common error codes
export const API_ERROR_CODES = {
  // Client errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  
  // Business logic errors
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  INTEGRATION_ERROR: 'INTEGRATION_ERROR',
  CHAT_ERROR: 'CHAT_ERROR',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// HTTP Status Code mappings
export const ERROR_STATUS_MAPPING: Record<ApiErrorCode, number> = {
  [API_ERROR_CODES.VALIDATION_ERROR]: 400,
  [API_ERROR_CODES.AUTHENTICATION_ERROR]: 401,
  [API_ERROR_CODES.AUTHORIZATION_ERROR]: 403,
  [API_ERROR_CODES.NOT_FOUND]: 404,
  [API_ERROR_CODES.CONFLICT]: 409,
  [API_ERROR_CODES.RATE_LIMITED]: 429,
  [API_ERROR_CODES.INTERNAL_ERROR]: 500,
  [API_ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
  [API_ERROR_CODES.DATABASE_ERROR]: 500,
  [API_ERROR_CODES.EXTERNAL_API_ERROR]: 502,
  [API_ERROR_CODES.AGENT_NOT_FOUND]: 404,
  [API_ERROR_CODES.INTEGRATION_ERROR]: 400,
  [API_ERROR_CODES.CHAT_ERROR]: 500,
};
