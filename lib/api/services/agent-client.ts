/**
 * Agent API Client - handles all agent-related operations
 */

import { BaseApiClient } from '../base/client';
import type { 
  ApiAgent, 
  CreateAgentRequest, 
  UpdateAgentRequest, 
  ApiAgentFilters 
} from '@/lib/types';

export class AgentApiClient extends BaseApiClient {
  /**
   * Get list of agents with optional filtering and organization scoping
   */
  async getAgents(filters?: ApiAgentFilters): Promise<ApiAgent[]> {
    const params = this.buildUrlParams(filters);
    const query = params.toString();
    return this.request<ApiAgent[]>(`/agents${query ? `?${query}` : ''}`);
  }

  /**
   * Get a single agent by ID
   */
  async getAgent(id: string): Promise<ApiAgent> {
    const response = this.request<{ agent: ApiAgent }>(`/agents/${id}`);
    return response.then(data => data.agent);
  }

  /**
   * Create a new agent - organization scoping handled by server
   */
  async createAgent(data: CreateAgentRequest): Promise<ApiAgent> {
    return this.request<ApiAgent>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing agent
   */
  async updateAgent(id: string, data: UpdateAgentRequest): Promise<ApiAgent> {
    return this.request<ApiAgent>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an agent
   */
  async deleteAgent(id: string): Promise<void> {
    await this.request<void>(`/agents/${id}`, {
      method: 'DELETE',
    });
  }
}