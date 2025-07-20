import { prisma } from '@/lib/database/database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  Agent,
  AgentWithRelations,
  CreateAgentData,
  UpdateAgentData,
  AgentFilters
} from '@/lib/types/database'

class AgentsService {
  /**
   * Get all agents with optional filtering and pagination   */
  async getAgents(filters: Omit<AgentFilters, 'organizationId'> = {}, organizationId: string): Promise<AgentWithRelations[]> {
    try {
      const {
        isActive,
        search,
        limit = 20,
        offset = 0
      } = filters

      const where = {
        organizationId,
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
                select: { id: true, name: true, type: true, isActive: true, credentials: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return agents as AgentWithRelations[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch agents (V2)', error as Error)
    }
  }

  /**
   * Get a single agent by ID   */
  async getAgentById(id: string, organizationId: string): Promise<AgentWithRelations | null> {
    try {
      const agent = await prisma.agent.findFirst({
        where: { 
          id,
          organizationId 
        },
        include: {
          organization: {
            select: { name: true, slug: true }
          },
          agentIntegrations: {
            include: {
              integration: {
                select: { id: true, name: true, type: true, isActive: true, credentials: true }
              }
            }
          }
        }
      })

      return agent as AgentWithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch agent ${id} (V2)`, error as Error)
    }
  }

  /**
   * Get agent by ID or throw error if not found   */
  async getAgentByIdOrThrow(id: string, organizationId: string): Promise<AgentWithRelations> {
    const agent = await this.getAgentById(id, organizationId)
    if (!agent) {
      throw new NotFoundError('Agent', id)
    }
    return agent
  }

  /**
   * Create a new agent   */
  async createAgent(data: Omit<CreateAgentData, 'organizationId'>, organizationId: string): Promise<Agent> {
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new ValidationError('Agent name is required', 'name')
      }

      const agent = await prisma.agent.create({
        data: {
          organizationId: organizationId,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          systemPrompt: data.systemPrompt?.trim() || null,
          model: data.model || 'gpt-4o',
          temperature: data.temperature ?? 0.7,
          maxTokens: data.maxTokens ?? 4000,
          rules: data.rules || undefined,
          tools: data.tools || [],
          isActive: data.isActive ?? true
        }
      })

      return agent as Agent
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create agent (V2)', error as Error)
    }
  }

  /**
   * Update an existing agent   */
  async updateAgent(id: string, data: UpdateAgentData, organizationId: string): Promise<Agent> {
    try {
      // Check if agent exists
      await this.getAgentByIdOrThrow(id, organizationId)

      const updateData: Record<string, unknown> = {}
      
      if (data.name !== undefined) updateData.name = data.name.trim()
      if (data.description !== undefined) updateData.description = data.description?.trim() || null
      if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt?.trim() || null
      if (data.model !== undefined) updateData.model = data.model
      if (data.temperature !== undefined) updateData.temperature = data.temperature
      if (data.maxTokens !== undefined) updateData.maxTokens = data.maxTokens
      if (data.rules !== undefined) updateData.rules = data.rules
      if (data.tools !== undefined) updateData.tools = data.tools
      if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive

      const agent = await prisma.agent.update({
        where: { 
          id,
          organizationId
        },
        data: updateData
      })

      return agent as Agent
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to update agent ${id} (V2)`, error as Error)
    }
  }

  /**
   * Delete an agent   */
  async deleteAgent(id: string, organizationId: string): Promise<void> {
    try {
      // Check if agent exists
      await this.getAgentByIdOrThrow(id, organizationId)

      await prisma.agent.delete({
        where: { 
          id,
          organizationId
        }
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to delete agent ${id} (V2)`, error as Error)
    }
  }

  /**
   * Get agents by organization   */
  async getAgentsByOrganization(organizationId: string): Promise<AgentWithRelations[]> {
    return this.getAgents({}, organizationId)
  }

  /**
   * Get agent by ID for public widget access (no organization scoping)
   * Used by widget routes where organizationId isn't available in auth context
   */
  async getAgentByIdPublic(id: string): Promise<AgentWithRelations | null> {
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
                select: { id: true, name: true, type: true, isActive: true, credentials: true }
              }
            }
          }
        }
      })

      return agent as AgentWithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch agent ${id} for public access (V2)`, error as Error)
    }
  }
}

// Export singleton instance
export const agentsService = new AgentsService()
