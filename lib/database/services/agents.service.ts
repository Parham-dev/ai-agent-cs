import { prisma } from '../database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'

// Define Agent type based on our schema
export interface Agent {
  id: string
  organizationId: string
  name: string
  instructions: string
  tools: string[]
  model: string
  agentConfig: PrismaJson.AgentConfigData // JSON field for agent configuration
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Extended types for better API responses
export interface AgentWithStats extends Agent {
  _count?: {
    conversations: number
  }
  organization?: {
    name: string
    slug: string
  }
}

export interface CreateAgentData {
  organizationId: string
  name: string
  instructions: string
  tools?: string[]
  model?: string
  agentConfig?: PrismaJson.AgentConfigData
  isActive?: boolean
}

export interface UpdateAgentData {
  name?: string
  instructions?: string
  tools?: string[]
  model?: string
  agentConfig?: PrismaJson.AgentConfigData
  isActive?: boolean
}

export interface AgentFilters {
  organizationId?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

class AgentsService {
  /**
   * Get all agents with optional filtering and pagination
   */
  async getAgents(filters: AgentFilters = {}): Promise<AgentWithStats[]> {
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
            { instructions: { contains: search, mode: 'insensitive' as const } }
          ]
        })
      }

      const agents = await prisma.agent.findMany({
        where,
        include: {
          _count: {
            select: { conversations: true }
          },
          organization: {
            select: { name: true, slug: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return agents
    } catch (error) {
      throw new DatabaseError('Failed to fetch agents', error as Error)
    }
  }

  /**
   * Get a single agent by ID
   */
  async getAgentById(id: string): Promise<AgentWithStats | null> {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id },
        include: {
          _count: {
            select: { conversations: true }
          },
          organization: {
            select: { name: true, slug: true }
          }
        }
      })

      return agent
    } catch (error) {
      throw new DatabaseError(`Failed to fetch agent ${id}`, error as Error)
    }
  }

  /**
   * Get agent by ID or throw error if not found
   */
  async getAgentByIdOrThrow(id: string): Promise<AgentWithStats> {
    const agent = await this.getAgentById(id)
    if (!agent) {
      throw new NotFoundError('Agent', id)
    }
    return agent
  }

  /**
   * Create a new agent
   */
  async createAgent(data: CreateAgentData): Promise<Agent> {
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new ValidationError('Agent name is required', 'name')
      }
      if (!data.instructions?.trim()) {
        throw new ValidationError('Agent instructions are required', 'instructions')
      }

      const agent = await prisma.agent.create({
        data: {
          organizationId: data.organizationId,
          name: data.name.trim(),
          instructions: data.instructions.trim(),
          tools: data.tools || [],
          model: data.model || 'gpt-4o',
          agentConfig: data.agentConfig || {},
          isActive: data.isActive ?? true
        }
      })

      return agent
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create agent', error as Error)
    }
  }

  /**
   * Update an existing agent
   */
  async updateAgent(id: string, data: UpdateAgentData): Promise<Agent> {
    try {
      // Check if agent exists
      await this.getAgentByIdOrThrow(id)

      const agent = await prisma.agent.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.instructions && { instructions: data.instructions.trim() }),
          ...(data.tools && { tools: data.tools }),
          ...(data.model && { model: data.model }),
          ...(typeof data.isActive === 'boolean' && { isActive: data.isActive })
        }
      })

      return agent
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to update agent ${id}`, error as Error)
    }
  }

  /**
   * Delete an agent
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
      throw new DatabaseError(`Failed to delete agent ${id}`, error as Error)
    }
  }

  /**
   * Toggle agent active status
   */
  async toggleAgentStatus(id: string): Promise<Agent> {
    try {
      const agent = await this.getAgentByIdOrThrow(id)
      
      return await this.updateAgent(id, { isActive: !agent.isActive })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to toggle agent status ${id}`, error as Error)
    }
  }

  /**
   * Get agents count by organization
   */
  async getAgentsCount(organizationId?: string): Promise<number> {
    try {
      return await prisma.agent.count({
        where: organizationId ? { organizationId } : undefined
      })
    } catch (error) {
      throw new DatabaseError('Failed to count agents', error as Error)
    }
  }

  /**
   * Get active agents for an organization (for chat routing)
   */
  async getActiveAgents(organizationId: string): Promise<Agent[]> {
    try {
      return await prisma.agent.findMany({
        where: {
          organizationId,
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      throw new DatabaseError('Failed to fetch active agents', error as Error)
    }
  }
}

// Export singleton instance
export const agentsService = new AgentsService()