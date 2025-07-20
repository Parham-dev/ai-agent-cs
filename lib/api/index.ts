/**
 * API Utilities - Clean domain-based architecture
 */

// Modular API architecture
export { ApiManager } from './manager/api-manager';
export { AgentApiClient } from './services/agent-client';
export { IntegrationApiClient } from './services/integration-client';
export { AgentIntegrationApiClient } from './services/agent-integration-client';
export { BaseApiClient } from './base/client';
export { ApiError, API_ERROR_CODES } from './base/error';

// Utilities and helpers
export * from './helpers';
export * from './routes';

// Convenience exports
export { ApiResponseHelper as Api } from './helpers';
export { API_ERROR_CODES as ErrorCodes } from '@/lib/types';

// Default API manager instance
import { ApiManager } from './manager/api-manager';
export const api = new ApiManager({ requireAuth: true });

// Legacy compatibility - keep apiClient export for any missed references
export const apiClient = api;
