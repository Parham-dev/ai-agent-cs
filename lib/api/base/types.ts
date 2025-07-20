/**
 * Shared types for API base client
 */

import type { ApiAgentFilters, ApiIntegrationFilters } from '@/lib/types';

export interface BaseApiClientOptions {
  baseUrl?: string;
  requireAuth?: boolean;
}

export type ListFilters = ApiAgentFilters | ApiIntegrationFilters;