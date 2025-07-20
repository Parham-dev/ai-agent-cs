// API-specific types for requests, responses, and client-server communication
// Simplified - let JSON.stringify handle Date serialization automatically

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

// API Entity Types (simplified - use Prisma types directly)
export interface ApiOrganization {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiIntegration {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  description?: string | null;
  isActive: boolean;
  credentials: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiAgent {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  systemPrompt?: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  rules?: Record<string, unknown> | null;
  tools: string[];
  createdAt: Date;
  updatedAt: Date;
  agentIntegrations?: ApiAgentIntegration[];  // Match Prisma schema
}

export interface ApiAgentIntegration {
  id: string;
  agentId: string;
  integrationId: string;
  isEnabled: boolean;
  selectedTools: string[];
  config?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  integration?: ApiIntegration;
}

// Request Types
export interface CreateAgentRequest {
  name: string;
  description?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  rules?: Record<string, unknown>;
  tools?: string[];
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  rules?: Record<string, unknown>;
  tools?: string[];
}

export interface CreateIntegrationRequest {
  name: string;
  type: string;
  description?: string;
  credentials: Record<string, unknown>;
}

export interface UpdateIntegrationRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  credentials?: Record<string, unknown>;
}

export interface CreateAgentIntegrationRequest {
  agentId: string;
  integrationId: string;
  selectedTools: string[];
  config?: Record<string, unknown>;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  description?: string;
}

// Filter Types
export interface ApiAgentFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ApiIntegrationFilters {
  type?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ApiOrganizationFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface IntegrationTool {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

// This file must be a module
export {}