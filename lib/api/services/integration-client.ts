/**
 * Integration API Client - handles all integration-related operations
 */

import { BaseApiClient } from '../base/client';
import type { 
  ApiIntegration, 
  CreateIntegrationRequest, 
  UpdateIntegrationRequest, 
  ApiIntegrationFilters,
  IntegrationTool
} from '@/lib/types';

export class IntegrationApiClient extends BaseApiClient {
  /**
   * Get list of integrations with optional filtering
   */
  async getIntegrations(filters?: ApiIntegrationFilters): Promise<ApiIntegration[]> {
    const params = this.buildUrlParams(filters);
    const query = params.toString();
    return this.request<ApiIntegration[]>(`/integrations${query ? `?${query}` : ''}`);
  }

  /**
   * Get a single integration by ID
   */
  async getIntegration(id: string): Promise<ApiIntegration> {
    return this.request<ApiIntegration>(`/integrations/${id}`);
  }

  /**
   * Create a new integration - organization scoping handled by server
   */
  async createIntegration(data: CreateIntegrationRequest): Promise<ApiIntegration> {
    return this.request<ApiIntegration>('/integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing integration
   */
  async updateIntegration(id: string, data: UpdateIntegrationRequest): Promise<ApiIntegration> {
    return this.request<ApiIntegration>(`/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an integration
   */
  async deleteIntegration(id: string): Promise<void> {
    await this.request<void>(`/integrations/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get available integration tools for a specific integration type
   */
  async getIntegrationTools(integrationType: string): Promise<IntegrationTool[]> {
    return this.request<IntegrationTool[]>(`/integrations/tools?type=${encodeURIComponent(integrationType)}`);
  }

  /**
   * Test an existing integration connection
   */
  async testIntegration(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/integrations/${id}/test`, {
      method: 'POST',
    });
  }

  /**
   * Test integration credentials before saving
   */
  async testIntegrationCredentials(
    type: string, 
    credentials: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/integrations/test', {
      method: 'POST',
      body: JSON.stringify({ type, credentials }),
    });
  }
}