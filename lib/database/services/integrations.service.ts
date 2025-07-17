import { prisma } from '@/lib/database/database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  Integration,
  IntegrationWithRelations,
  CreateIntegrationData,
  UpdateIntegrationData,
  IntegrationFilters
} from '@/lib/types/database'

class IntegrationsService {
  /**
   * Get all integrations with optional filtering and pagination   */
  async getIntegrations(filters: IntegrationFilters = {}): Promise<IntegrationWithRelations[]> {
    try {
      const {
        organizationId,
        type,
        isActive,
        search,
        limit = 20,
        offset = 0
      } = filters

      const where = {
        ...(organizationId && { organizationId }),
        ...(type && { type }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
            { type: { contains: search, mode: 'insensitive' as const } }
          ]
        })
      }

      const integrations = await prisma.integration.findMany({
        where,
        include: {
          organization: {
            select: { name: true, slug: true }
          },
          agentIntegrations: {
            select: { agentId: true, isEnabled: true, selectedTools: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return integrations as IntegrationWithRelations[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch integrations (V2)', error as Error)
    }
  }

  /**
   * Get a single integration by ID   */
  async getIntegrationById(id: string): Promise<IntegrationWithRelations | null> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { id },
        include: {
          organization: {
            select: { name: true, slug: true }
          },
          agentIntegrations: {
            select: { agentId: true, isEnabled: true, selectedTools: true }
          }
        }
      })

      return integration as IntegrationWithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integration ${id} (V2)`, error as Error)
    }
  }

  /**
   * Get integration by ID or throw error if not found   */
  async getIntegrationByIdOrThrow(id: string): Promise<IntegrationWithRelations> {
    const integration = await this.getIntegrationById(id)
    if (!integration) {
      throw new NotFoundError('Integration', id)
    }
    return integration
  }

  /**
   * Get integration by organization and type   */
  async getIntegrationByOrganizationAndType(
    organizationId: string, 
    type: string
  ): Promise<Integration | null> {
    try {
      const integration = await prisma.integration.findUnique({
        where: {
          organizationId_type: {
            organizationId,
            type
          }
        }
      })

      return integration as Integration | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integration ${type} for organization ${organizationId} (V2)`, error as Error)
    }
  }

  /**
   * Create a new integration   */
  async createIntegration(data: CreateIntegrationData): Promise<Integration> {
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new ValidationError('Integration name is required', 'name')
      }
      if (!data.type?.trim()) {
        throw new ValidationError('Integration type is required', 'type')
      }
      if (!data.organizationId) {
        throw new ValidationError('Organization ID is required', 'organizationId')
      }
      if (!data.credentials || Object.keys(data.credentials).length === 0) {
        throw new ValidationError('Integration credentials are required', 'credentials')
      }

      // Check if integration of this type already exists for this organization
      const existingIntegration = await this.getIntegrationByOrganizationAndType(
        data.organizationId, 
        data.type
      )
      
      if (existingIntegration) {
        throw new ValidationError(
          `Integration of type '${data.type}' already exists for this organization`, 
          'type'
        )
      }

      const integration = await prisma.integration.create({
        data: {
          organizationId: data.organizationId,
          name: data.name.trim(),
          type: data.type.trim(),
          description: data.description?.trim() || null,
          credentials: data.credentials,
          isActive: data.isActive ?? true
        }
      })

      return integration as Integration
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create integration (V2)', error as Error)
    }
  }

  /**
   * Update an existing integration   */
  async updateIntegration(id: string, data: UpdateIntegrationData): Promise<Integration> {
    try {
      // Check if integration exists
      await this.getIntegrationByIdOrThrow(id)

      const updateData: Record<string, unknown> = {}
      
      if (data.name !== undefined) updateData.name = data.name.trim()
      if (data.description !== undefined) updateData.description = data.description?.trim() || null
      if (data.credentials !== undefined) updateData.credentials = data.credentials
      if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive

      const integration = await prisma.integration.update({
        where: { id },
        data: updateData
      })

      return integration as Integration
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to update integration ${id} (V2)`, error as Error)
    }
  }

  /**
   * Delete an integration   */
  async deleteIntegration(id: string): Promise<void> {
    try {
      // Check if integration exists
      await this.getIntegrationByIdOrThrow(id)

      await prisma.integration.delete({
        where: { id }
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to delete integration ${id} (V2)`, error as Error)
    }
  }

  /**
   * Get integrations by organization   */
  async getIntegrationsByOrganization(organizationId: string): Promise<IntegrationWithRelations[]> {
    return this.getIntegrations({ organizationId })
  }
}

// Export singleton instance
export const integrationsService = new IntegrationsService()
