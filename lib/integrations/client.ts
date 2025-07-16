/**
 * Integration client for organization-level integration management
 * Hardcoded for parham organization, scalable for future multi-org support
 */

import { v2ApiClient } from '@/lib/api/v2-client'
import type { 
  Integration, 
  CreateIntegrationRequest, 
  UpdateIntegrationRequest, 
  IntegrationFilters,
  IntegrationTool
} from '@/lib/api/types'

class IntegrationsClient {
  async getIntegrations(filters?: Omit<IntegrationFilters, 'organizationId'>): Promise<Integration[]> {
    return v2ApiClient.getIntegrations(filters)
  }

  async getIntegration(id: string): Promise<Integration> {
    return v2ApiClient.getIntegration(id)
  }

  async createIntegration(data: Omit<CreateIntegrationRequest, 'organizationId'>): Promise<Integration> {
    return v2ApiClient.createIntegration(data)
  }

  async updateIntegration(id: string, data: UpdateIntegrationRequest): Promise<Integration> {
    return v2ApiClient.updateIntegration(id, data)
  }

  async deleteIntegration(id: string): Promise<void> {
    return v2ApiClient.deleteIntegration(id)
  }

  async getIntegrationTools(type: string): Promise<IntegrationTool[]> {
    return v2ApiClient.getIntegrationTools(type)
  }

  // Helper method to get integrations by type
  async getIntegrationsByType(type: string): Promise<Integration[]> {
    return this.getIntegrations({ type })
  }

  // Helper method to get active integrations only
  async getActiveIntegrations(): Promise<Integration[]> {
    return this.getIntegrations({ isActive: true })
  }
}

export const integrationsClient = new IntegrationsClient()