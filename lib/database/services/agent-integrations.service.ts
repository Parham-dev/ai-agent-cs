import { prisma } from '@/lib/database/database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  AgentIntegration,
  CreateAgentIntegrationData,
  UpdateAgentIntegrationData
} from '@/lib/types/database'

class AgentIntegrationsService {
  /**
   * Get agent integration relationship   */
  async getAgentIntegration(agentId: string, integrationId: string): Promise<AgentIntegration | null> {
    try {
      const agentIntegration = await prisma.agentIntegration.findUnique({
        where: {
          agentId_integrationId: {
            agentId,
            integrationId
          }
        }
      })

      return agentIntegration as AgentIntegration | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch agent integration for agent ${agentId} and integration ${integrationId} (V2)`, error as Error)
    }
  }

  /**
   * Get all integrations for an agent   */
  async getAgentIntegrations(agentId: string): Promise<(AgentIntegration & { integration: { name: string; type: string; isActive: boolean } })[]> {
    try {
      const agentIntegrations = await prisma.agentIntegration.findMany({
        where: { agentId },
        include: {
          integration: {
            select: { name: true, type: true, isActive: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return agentIntegrations as (AgentIntegration & { integration: { name: string; type: string; isActive: boolean } })[]
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integrations for agent ${agentId} (V2)`, error as Error)
    }
  }

  /**
   * Get all agents using an integration   */
  async getIntegrationAgents(integrationId: string): Promise<(AgentIntegration & { agent: { name: string; isActive: boolean } })[]> {
    try {
      const agentIntegrations = await prisma.agentIntegration.findMany({
        where: { integrationId },
        include: {
          agent: {
            select: { name: true, isActive: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return agentIntegrations as (AgentIntegration & { agent: { name: string; isActive: boolean } })[]
    } catch (error) {
      throw new DatabaseError(`Failed to fetch agents for integration ${integrationId} (V2)`, error as Error)
    }
  }

  /**
   * Create agent-integration relationship   */
  async createAgentIntegration(data: CreateAgentIntegrationData): Promise<AgentIntegration> {
    try {
      // Validate required fields
      if (!data.agentId) {
        throw new ValidationError('Agent ID is required', 'agentId')
      }
      if (!data.integrationId) {
        throw new ValidationError('Integration ID is required', 'integrationId')
      }
      if (!Array.isArray(data.selectedTools)) {
        throw new ValidationError('Selected tools must be an array', 'selectedTools')
      }

      // Check if relationship already exists
      const existingRelation = await this.getAgentIntegration(data.agentId, data.integrationId)
      if (existingRelation) {
        throw new ValidationError('Agent-integration relationship already exists', 'relationship')
      }

      const agentIntegration = await prisma.agentIntegration.create({
        data: {
          agentId: data.agentId,
          integrationId: data.integrationId,
          selectedTools: data.selectedTools,
          config: data.config || undefined,
          isEnabled: data.isEnabled ?? true
        }
      })

      return agentIntegration as AgentIntegration
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create agent-integration relationship (V2)', error as Error)
    }
  }

  /**
   * Update agent-integration relationship   */
  async updateAgentIntegration(
    agentId: string, 
    integrationId: string, 
    data: UpdateAgentIntegrationData
  ): Promise<AgentIntegration> {
    try {
      // Check if relationship exists
      const existingRelation = await this.getAgentIntegration(agentId, integrationId)
      if (!existingRelation) {
        throw new NotFoundError('Agent-integration relationship', `${agentId}-${integrationId}`)
      }

      const updateData: Record<string, unknown> = {}
      
      if (data.selectedTools !== undefined) updateData.selectedTools = data.selectedTools
      if (data.config !== undefined) updateData.config = data.config
      if (typeof data.isEnabled === 'boolean') updateData.isEnabled = data.isEnabled

      const agentIntegration = await prisma.agentIntegration.update({
        where: {
          agentId_integrationId: {
            agentId,
            integrationId
          }
        },
        data: updateData
      })

      return agentIntegration as AgentIntegration
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to update agent-integration relationship ${agentId}-${integrationId} (V2)`, error as Error)
    }
  }

  /**
   * Delete agent-integration relationship   */
  async deleteAgentIntegration(agentId: string, integrationId: string): Promise<void> {
    try {
      // Check if relationship exists
      const existingRelation = await this.getAgentIntegration(agentId, integrationId)
      if (!existingRelation) {
        throw new NotFoundError('Agent-integration relationship', `${agentId}-${integrationId}`)
      }

      await prisma.agentIntegration.delete({
        where: {
          agentId_integrationId: {
            agentId,
            integrationId
          }
        }
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to delete agent-integration relationship ${agentId}-${integrationId} (V2)`, error as Error)
    }
  }

  /**
   * Enable/disable agent-integration relationship   */
  async toggleAgentIntegration(agentId: string, integrationId: string, isEnabled: boolean): Promise<AgentIntegration> {
    return this.updateAgentIntegration(agentId, integrationId, { isEnabled })
  }

  /**
   * Update selected tools for agent-integration   */
  async updateSelectedTools(agentId: string, integrationId: string, selectedTools: string[]): Promise<AgentIntegration> {
    return this.updateAgentIntegration(agentId, integrationId, { selectedTools })
  }
}

// Export singleton instance
export const agentIntegrationsService = new AgentIntegrationsService()
