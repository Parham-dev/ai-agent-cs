/**
 * Agent-Integration relationship client
 * Manages the many-to-many relationship between agents and integrations
 */

import { v2ApiClient } from '@/lib/api/v2-client'
import type { 
  AgentIntegration, 
  CreateAgentIntegrationRequest
} from '@/lib/api/types'

class AgentIntegrationsClient {
  // Get all integrations for a specific agent
  async getAgentIntegrations(agentId: string): Promise<AgentIntegration[]> {
    return v2ApiClient.getAgentIntegrations(agentId)
  }

  // Get all agents using a specific integration
  async getIntegrationAgents(integrationId: string): Promise<AgentIntegration[]> {
    return v2ApiClient.getIntegrationAgents(integrationId)
  }

  // Connect an agent to an integration with selected tools
  async connectAgentToIntegration(data: CreateAgentIntegrationRequest): Promise<AgentIntegration> {
    return v2ApiClient.createAgentIntegration(data)
  }

  // Disconnect an agent from an integration
  async disconnectAgentFromIntegration(agentId: string, integrationId: string): Promise<void> {
    return v2ApiClient.deleteAgentIntegration(agentId, integrationId)
  }

  // Update tools for an existing agent-integration relationship
  async updateAgentIntegrationTools(agentId: string, integrationId: string, selectedTools: string[]): Promise<AgentIntegration> {
    // First disconnect, then reconnect with new tools
    await this.disconnectAgentFromIntegration(agentId, integrationId)
    return this.connectAgentToIntegration({
      agentId,
      integrationId,
      selectedTools
    })
  }
}

export const agentIntegrationsClient = new AgentIntegrationsClient()