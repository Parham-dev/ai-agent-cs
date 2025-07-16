import { prisma } from '../../database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  AgentV2,
  AgentV2WithRelations,
  CreateAgentV2Data,
  UpdateAgentV2Data,
  AgentV2Filters
} from '@/lib/types/v2/schema'

class AgentsServiceV2 {
  /**
   * Get all agents with optional filtering and pagination (V2)
   */
  async getAgents(filters: AgentV2Filters = {}): Promise<AgentV2WithRelations[]> {
    try {
      const {
        organizationId,
        isActive,
        search,
        limit = 20,
        offset = 0
      } = filters

      const where = {
        ...(organizationId && { organizationId }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { systemPrompt: { contains: search, mode: 'insensitive' as const } }
          ]
        })
      }

      const agents = await prisma.agent.findMany({
        where,
        include: {
          organization: {
            select: { name: true, slug: true }
          },
          agentIntegrations: {
            include: {
              integration: {
                select: { name: true, type: true, isActive: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return agents as AgentV2WithRelations[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch agents (V2)', error as Error)
    }
  }

  /**
   * Get a single agent by ID (V2)
   */
  async getAgentById(id: string): Promise<AgentV2WithRelations | null> {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id },
        include: {
          organization: {
            select: { name: true, slug: true }
          },
          agentIntegrations: {
            include: {
              integration: {
                select: { name: true, type: true, isActive: true }
              }
            }
          }
        }
      })

      return agent as AgentV2WithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch agent ${id} (V2)`, error as Error)
    }
  }

  /**
   * Get agent by ID or throw error if not found (V2)
   */
  async getAgentByIdOrThrow(id: string): Promise<AgentV2WithRelations> {
    const agent = await this.getAgentById(id)
    if (!agent) {
      throw new NotFoundError('Agent', id)
    }
    return agent
  }

  /**
   * Create a new agent (V2)
   */
  async createAgent(data: CreateAgentV2Data): Promise<AgentV2> {
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new ValidationError('Agent name is required', 'name')
      }
      if (!data.organizationId) {
        throw new ValidationError('Organization ID is required', 'organizationId')
      }

      const agent = await prisma.agent.create({
        data: {
          organizationId: data.organizationId,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          systemPrompt: data.systemPrompt?.trim() || null,
          model: data.model || 'gpt-4o',
          temperature: data.temperature ?? 0.7,
          maxTokens: data.maxTokens ?? 4000,
          rules: data.rules || null,
          isActive: data.isActive ?? true
        }
      })

      return agent as AgentV2
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create agent (V2)', error as Error)
    }
  }

  /**
   * Update an existing agent (V2)
   */
  async updateAgent(id: string, data: UpdateAgentV2Data): Promise<AgentV2> {
    try {
      // Check if agent exists
      await this.getAgentByIdOrThrow(id)

      const updateData: Record<string, unknown> = {}
      
      if (data.name !== undefined) updateData.name = data.name.trim()
      if (data.description !== undefined) updateData.description = data.description?.trim() || null
      if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt?.trim() || null
      if (data.model !== undefined) updateData.model = data.model
      if (data.temperature !== undefined) updateData.temperature = data.temperature
      if (data.maxTokens !== undefined) updateData.maxTokens = data.maxTokens
      if (data.rules !== undefined) updateData.rules = data.rules
      if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive

      const agent = await prisma.agent.update({
        where: { id },
        data: updateData
      })

      return agent as AgentV2
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to update agent ${id} (V2)`, error as Error)
    }
  }

  /**
   * Delete an agent (V2)
   */
  async deleteAgent(id: string): Promise<void> {
    try {
      // Check if agent exists
      await this.getAgentByIdOrThrow(id)

      await prisma.agent.delete({
        where: { id }
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to delete agent ${id} (V2)`, error as Error)
    }
  }

  /**
   * Get agents by organization (V2)
   */
  async getAgentsByOrganization(organizationId: string): Promise<AgentV2WithRelations[]> {
    return this.getAgents({ organizationId })
  }
}

// Export singleton instance following your pattern
export const agentsServiceV2 = new AgentsServiceV2()
export default agentsServiceV2
