import type { Agent, UpdateAgentData } from '@/lib/database/services/agents.service'

export interface CreateAgentRequest {
  organizationId: string
  name: string
  instructions: string
  tools?: string[]
  model?: string
  isActive?: boolean
}

export interface AgentsResponse {
  agents: Agent[]
}

export interface AgentResponse {
  agent: Agent
}

class AgentsClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`/api/agents${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async getAgents(filters?: {
    organizationId?: string
    isActive?: boolean
    search?: string
    limit?: number
    offset?: number
  }): Promise<Agent[]> {
    const searchParams = new URLSearchParams()
    
    if (filters?.organizationId) searchParams.append('organizationId', filters.organizationId)
    if (filters?.isActive !== undefined) searchParams.append('isActive', filters.isActive.toString())
    if (filters?.search) searchParams.append('search', filters.search)
    if (filters?.limit) searchParams.append('limit', filters.limit.toString())
    if (filters?.offset) searchParams.append('offset', filters.offset.toString())

    const query = searchParams.toString()
    const endpoint = query ? `?${query}` : ''
    
    const response = await this.request<AgentsResponse>(endpoint)
    return response.agents
  }

  async getAgent(id: string): Promise<Agent> {
    const response = await this.request<AgentResponse>(`/${id}`)
    return response.agent
  }

  async createAgent(data: CreateAgentRequest): Promise<Agent> {
    const response = await this.request<AgentResponse>('/create', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.agent
  }

  async updateAgent(id: string, data: UpdateAgentData): Promise<Agent> {
    const response = await this.request<AgentResponse>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    return response.agent
  }

  async deleteAgent(id: string): Promise<void> {
    await this.request(`/${id}`, {
      method: 'DELETE',
    })
  }
}

export const agentsClient = new AgentsClient()
