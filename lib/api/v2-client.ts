/**
 * V2 API Client with proper error handling and organization context
 */

import { 
  ApiResponse, 
  Agent,
  Integration,
  Organization,
  AgentIntegration,
  CreateAgentRequest,
  UpdateAgentRequest,
  CreateIntegrationRequest,
  UpdateIntegrationRequest,
  CreateAgentIntegrationRequest,
  AgentFilters,
  IntegrationFilters,
  IntegrationTool,
  API_ERROR_CODES,
  ApiErrorCode
} from './types';

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

export class V2ApiClient {
  private baseUrl: string;
  private organizationId: string;

  constructor(organizationId: string, baseUrl: string = '/api/v2') {
    this.baseUrl = baseUrl;
    this.organizationId = organizationId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

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

  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    return this.request<Organization[]>('/organizations');
  }

  async getOrganization(id: string): Promise<Organization> {
    return this.request<Organization>(`/organizations/${id}`);
  }

  // Agents
  async getAgents(filters?: Omit<AgentFilters, 'organizationId'>): Promise<Agent[]> {
    const params = new URLSearchParams();
    
    // Always filter by organization
    params.append('organizationId', this.organizationId);
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    return this.request<Agent[]>(`/agents${query ? `?${query}` : ''}`);
  }

  async getAgent(id: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${id}`);
  }

  async createAgent(data: Omit<CreateAgentRequest, 'organizationId'>): Promise<Agent> {
    return this.request<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        organizationId: this.organizationId,
      }),
    });
  }

  async updateAgent(id: string, data: UpdateAgentRequest): Promise<Agent> {
    return this.request<Agent>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAgent(id: string): Promise<void> {
    return this.request<void>(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Integrations
  async getIntegrations(filters?: Omit<IntegrationFilters, 'organizationId'>): Promise<Integration[]> {
    const params = new URLSearchParams();
    
    // Always filter by organization
    params.append('organizationId', this.organizationId);
    
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    return this.request<Integration[]>(`/integrations${query ? `?${query}` : ''}`);
  }

  async getIntegration(id: string): Promise<Integration> {
    return this.request<Integration>(`/integrations/${id}`);
  }

  async createIntegration(data: Omit<CreateIntegrationRequest, 'organizationId'>): Promise<Integration> {
    return this.request<Integration>('/integrations', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        organizationId: this.organizationId,
      }),
    });
  }

  async updateIntegration(id: string, data: UpdateIntegrationRequest): Promise<Integration> {
    return this.request<Integration>(`/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIntegration(id: string): Promise<void> {
    return this.request<void>(`/integrations/${id}`, {
      method: 'DELETE',
    });
  }

  async getIntegrationTools(type: string): Promise<IntegrationTool[]> {
    return this.request<IntegrationTool[]>(`/integrations/tools?type=${type}`);
  }

  // Agent-Integration Relationships
  async getAgentIntegrations(agentId: string): Promise<AgentIntegration[]> {
    return this.request<AgentIntegration[]>(`/agent-integrations?agentId=${agentId}`);
  }

  async getIntegrationAgents(integrationId: string): Promise<AgentIntegration[]> {
    return this.request<AgentIntegration[]>(`/agent-integrations?integrationId=${integrationId}`);
  }

  async createAgentIntegration(data: CreateAgentIntegrationRequest): Promise<AgentIntegration> {
    return this.request<AgentIntegration>('/agent-integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAgentIntegration(agentId: string, integrationId: string): Promise<void> {
    return this.request<void>(`/agent-integrations?agentId=${agentId}&integrationId=${integrationId}`, {
      method: 'DELETE',
    });
  }

  // Chat (legacy endpoint - may need updating)
  async chat(agentId: string, message: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/agents/${agentId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}

import { getOrganizationId } from '../context/organization';

// Default client instance with parham organization context
export const v2ApiClient = new V2ApiClient(getOrganizationId());