import { v2ApiClient } from '@/lib/api/v2-client'
import type { Agent, CreateAgentRequest, UpdateAgentRequest, AgentFilters } from '@/lib/api/types'

class AgentsClient {
  async getAgents(filters?: Omit<AgentFilters, 'organizationId'>): Promise<Agent[]> {
    return v2ApiClient.getAgents(filters)
  }

  async getAgent(id: string): Promise<Agent> {
    return v2ApiClient.getAgent(id)
  }

  async createAgent(data: Omit<CreateAgentRequest, 'organizationId'>): Promise<Agent> {
    return v2ApiClient.createAgent(data)
  }

  async updateAgent(id: string, data: UpdateAgentRequest): Promise<Agent> {
    return v2ApiClient.updateAgent(id, data)
  }

  async deleteAgent(id: string): Promise<void> {
    return v2ApiClient.deleteAgent(id)
  }
}

export const agentsClient = new AgentsClient()
