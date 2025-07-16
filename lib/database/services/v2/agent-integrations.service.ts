import { prisma } from '../../database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  AgentIntegrationV2,
  CreateAgentIntegrationV2Data,
  UpdateAgentIntegrationV2Data
} from '@/lib/types/v2/schema'

class AgentIntegrationsServiceV2 {
  /**
   * Get agent integration relationship (V2)
   */
  async getAgentIntegration(agentId: string, integrationId: string): Promise<AgentIntegrationV2 | null> {
    try {
      const agentIntegration = await prisma.agentIntegration.findUnique({
        where: {
          agentId_integrationId: {
            agentId,
            integrationId
          }
        }
      })

      return agentIntegration as AgentIntegrationV2 | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch agent integration for agent ${agentId} and integration ${integrationId} (V2)`, error as Error)
    }
  }

  /**
   * Get all integrations for an agent (V2)
   */
  async getAgentIntegrations(agentId: string): Promise<(AgentIntegrationV2 & { integration: { name: string; type: string; isActive: boolean } })[]> {
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

      return agentIntegrations as (AgentIntegrationV2 & { integration: { name: string; type: string; isActive: boolean } })[]
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integrations for agent ${agentId} (V2)`, error as Error)
    }
  }

  /**
   * Get all agents using an integration (V2)
   */
  async getIntegrationAgents(integrationId: string): Promise<(AgentIntegrationV2 & { agent: { name: string; isActive: boolean } })[]> {
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

      return agentIntegrations as (AgentIntegrationV2 & { agent: { name: string; isActive: boolean } })[]
    } catch (error) {
      throw new DatabaseError(`Failed to fetch agents for integration ${integrationId} (V2)`, error as Error)
    }
  }

  /**
   * Create agent-integration relationship (V2)
   */
  async createAgentIntegration(data: CreateAgentIntegrationV2Data): Promise<AgentIntegrationV2> {
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
          config: data.config || null,
          isEnabled: data.isEnabled ?? true
        }
      })

      return agentIntegration as AgentIntegrationV2
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create agent-integration relationship (V2)', error as Error)
    }
  }

  /**
   * Update agent-integration relationship (V2)
   */
  async updateAgentIntegration(
    agentId: string, 
    integrationId: string, 
    data: UpdateAgentIntegrationV2Data
  ): Promise<AgentIntegrationV2> {
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

      return agentIntegration as AgentIntegrationV2
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to update agent-integration relationship ${agentId}-${integrationId} (V2)`, error as Error)
    }
  }

  /**
   * Delete agent-integration relationship (V2)
   */
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
   * Enable/disable agent-integration relationship (V2)
   */
  async toggleAgentIntegration(agentId: string, integrationId: string, isEnabled: boolean): Promise<AgentIntegrationV2> {
    return this.updateAgentIntegration(agentId, integrationId, { isEnabled })
  }

  /**
   * Update selected tools for agent-integration (V2)
   */
  async updateSelectedTools(agentId: string, integrationId: string, selectedTools: string[]): Promise<AgentIntegrationV2> {
    return this.updateAgentIntegration(agentId, integrationId, { selectedTools })
  }
}

// Export singleton instance following your pattern
export const agentIntegrationsServiceV2 = new AgentIntegrationsServiceV2()
export default agentIntegrationsServiceV2
