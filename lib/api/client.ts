/**
 * Unified API Client - handles both authenticated and public requests
 * Supports optional authentication via Supabase session
 */

import { createClientSupabaseClient } from '@/lib/database/clients';
import { 
  ApiResponse, 
  ApiAgent,
  ApiIntegration,
  ApiOrganization,
  ApiAgentIntegration,
  CreateAgentRequest,
  UpdateAgentRequest,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  CreateAgentIntegrationRequest,
  ApiAgentFilters,
  ApiIntegrationFilters,
  IntegrationTool,
  API_ERROR_CODES,
  ApiErrorCode
} from '@/lib/types';

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

interface ApiClientOptions {
  baseUrl?: string;
  organizationId?: string;
  requireAuth?: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private organizationId?: string;
  private requireAuth: boolean;
  private supabase = createClientSupabaseClient();

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '/api/v2';
    this.organizationId = options.organizationId;
    this.requireAuth = options.requireAuth ?? true;
  }

  /**
   * Get current auth token from Supabase session
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get auth token if authentication is required
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.requireAuth) {
      const token = await this.getAuthToken();
      if (!token) {
        throw new ApiError(
          API_ERROR_CODES.AUTHENTICATION_ERROR,
          'Missing or invalid authorization header'
        );
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle non-JSON error responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData: ApiResponse = await response.json();
        throw new ApiError(
          errorData.error?.code as ApiErrorCode || API_ERROR_CODES.INTERNAL_ERROR,
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.error?.details
        );
      } else {
        throw new ApiError(
          API_ERROR_CODES.INTERNAL_ERROR,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
    }

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new ApiError(
        data.error?.code as ApiErrorCode || API_ERROR_CODES.INTERNAL_ERROR,
        data.error?.message || 'An unexpected error occurred',
        data.error?.details
      );
    }

    return data.data!;
  }

  // Organizations (Super Admin only)
  async getOrganizations(): Promise<ApiOrganization[]> {
    return this.request<ApiOrganization[]>('/organizations');
  }

  async getOrganization(id: string): Promise<ApiOrganization> {
    return this.request<ApiOrganization>(`/organizations/${id}`);
  }

  async createOrganization(data: Omit<CreateIntegrationRequest, 'organizationId'>): Promise<ApiOrganization> {
    return this.request<ApiOrganization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrganization(id: string, data: Partial<ApiOrganization>): Promise<ApiOrganization> {
    return this.request<ApiOrganization>(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrganization(id: string): Promise<void> {
    await this.request<void>(`/organizations/${id}`, {
      method: 'DELETE',
    });
  }

  // Agents (Organization scoped)
  async getAgents(filters?: ApiAgentFilters): Promise<ApiAgent[]> {
    const params = new URLSearchParams();
    
    // Add organization filter if specified in constructor
    if (this.organizationId && !filters?.organizationId) {
      if (filters) {
        filters.organizationId = this.organizationId;
      } else {
        filters = { organizationId: this.organizationId };
      }
    }
    
    if (filters?.organizationId) params.append('organizationId', filters.organizationId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    return this.request<ApiAgent[]>(`/agents${query ? `?${query}` : ''}`);
  }

  async getAgent(id: string): Promise<ApiAgent> {
    return this.request<ApiAgent>(`/agents/${id}`);
  }

  async createAgent(data: CreateAgentRequest): Promise<ApiAgent> {
    // Auto-inject organizationId if not provided and we have one
    const requestData = this.organizationId && !data.organizationId 
      ? { ...data, organizationId: this.organizationId }
      : data;

    return this.request<ApiAgent>('/agents', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async updateAgent(id: string, data: UpdateAgentRequest): Promise<ApiAgent> {
    return this.request<ApiAgent>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAgent(id: string): Promise<void> {
    await this.request<void>(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Integrations (Organization scoped)
  async getIntegrations(filters?: ApiIntegrationFilters): Promise<ApiIntegration[]> {
    const params = new URLSearchParams();
    
    // Add organization filter if specified in constructor
    if (this.organizationId && !filters?.organizationId) {
      if (filters) {
        filters.organizationId = this.organizationId;
      } else {
        filters = { organizationId: this.organizationId };
      }
    }
    
    if (filters?.organizationId) params.append('organizationId', filters.organizationId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    return this.request<ApiIntegration[]>(`/integrations${query ? `?${query}` : ''}`);
  }

  async getIntegration(id: string): Promise<ApiIntegration> {
    return this.request<ApiIntegration>(`/integrations/${id}`);
  }

  async createIntegration(data: CreateIntegrationRequest): Promise<ApiIntegration> {
    // Auto-inject organizationId if not provided and we have one
    const requestData = this.organizationId && !data.organizationId 
      ? { ...data, organizationId: this.organizationId }
      : data;

    return this.request<ApiIntegration>('/integrations', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async updateIntegration(id: string, data: UpdateIntegrationRequest): Promise<ApiIntegration> {
    return this.request<ApiIntegration>(`/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIntegration(id: string): Promise<void> {
    await this.request<void>(`/integrations/${id}`, {
      method: 'DELETE',
    });
  }

  // Integration Tools
  async getIntegrationTools(): Promise<IntegrationTool[]> {
    return this.request<IntegrationTool[]>('/integrations/tools');
  }

  async testIntegration(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/integrations/${id}/test`, {
      method: 'POST',
    });
  }

  async testIntegrationCredentials(type: string, credentials: Record<string, unknown>): Promise<{ success: boolean; message?: string; businessName?: string }> {
    return this.request<{ success: boolean; message?: string; businessName?: string }>('/integrations/test', {
      method: 'POST',
      body: JSON.stringify({ type, credentials }),
    });
  }

  // Agent Integrations
  async getAgentIntegrations(agentId?: string): Promise<ApiAgentIntegration[]> {
    const params = new URLSearchParams();
    if (agentId) params.append('agentId', agentId);
    
    const query = params.toString();
    return this.request<ApiAgentIntegration[]>(`/agent-integrations${query ? `?${query}` : ''}`);
  }

  async createAgentIntegration(data: CreateAgentIntegrationRequest): Promise<ApiAgentIntegration> {
    return this.request<ApiAgentIntegration>('/agent-integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAgentIntegration(id: string): Promise<void> {
    await this.request<void>(`/agent-integrations/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instances for different use cases
export const apiClient = new ApiClient({ requireAuth: true });
export const publicApiClient = new ApiClient({ requireAuth: false });

// Helper function to create organization-scoped client
export function createOrganizationApiClient(organizationId: string): ApiClient {
  return new ApiClient({ organizationId, requireAuth: true });
}