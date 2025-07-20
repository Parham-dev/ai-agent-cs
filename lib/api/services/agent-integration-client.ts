/**
 * Agent Integration API Client - handles agent-integration relationships
 */

import { BaseApiClient } from '../base/client';
import type { 
  ApiAgentIntegration, 
  CreateAgentIntegrationRequest 
} from '@/lib/types';

export class AgentIntegrationApiClient extends BaseApiClient {
  /**
   * Get agent integrations, optionally filtered by agent ID
   */
  async getAgentIntegrations(agentId?: string): Promise<ApiAgentIntegration[]> {
    const params = new URLSearchParams();
    if (agentId) {
      params.append('agentId', agentId);
    }
    
    const query = params.toString();
    return this.request<ApiAgentIntegration[]>(`/agent-integrations${query ? `?${query}` : ''}`);
  }

  /**
   * Create a new agent-integration relationship
   */
  async createAgentIntegration(data: CreateAgentIntegrationRequest): Promise<ApiAgentIntegration> {
    return this.request<ApiAgentIntegration>('/agent-integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an agent-integration relationship
   */
  async deleteAgentIntegration(id: string): Promise<void> {
    await this.request<void>(`/agent-integrations/${id}`, {
      method: 'DELETE',
    });
  }
}