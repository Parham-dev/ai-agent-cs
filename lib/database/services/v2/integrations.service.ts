import { prisma } from '../../database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  IntegrationV2,
  IntegrationV2WithRelations,
  CreateIntegrationV2Data,
  UpdateIntegrationV2Data,
  IntegrationV2Filters
} from '@/lib/types/v2/schema'

class IntegrationsServiceV2 {
  /**
   * Get all integrations with optional filtering and pagination (V2)
   */
  async getIntegrations(filters: IntegrationV2Filters = {}): Promise<IntegrationV2WithRelations[]> {
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

      return integrations as IntegrationV2WithRelations[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch integrations (V2)', error as Error)
    }
  }

  /**
   * Get a single integration by ID (V2)
   */
  async getIntegrationById(id: string): Promise<IntegrationV2WithRelations | null> {
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

      return integration as IntegrationV2WithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integration ${id} (V2)`, error as Error)
    }
  }

  /**
   * Get integration by ID or throw error if not found (V2)
   */
  async getIntegrationByIdOrThrow(id: string): Promise<IntegrationV2WithRelations> {
    const integration = await this.getIntegrationById(id)
    if (!integration) {
      throw new NotFoundError('Integration', id)
    }
    return integration
  }

  /**
   * Get integration by organization and type (V2)
   */
  async getIntegrationByOrganizationAndType(
    organizationId: string, 
    type: string
  ): Promise<IntegrationV2 | null> {
    try {
      const integration = await prisma.integration.findUnique({
        where: {
          organizationId_type: {
            organizationId,
            type
          }
        }
      })

      return integration as IntegrationV2 | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integration ${type} for organization ${organizationId} (V2)`, error as Error)
    }
  }

  /**
   * Create a new integration (V2)
   */
  async createIntegration(data: CreateIntegrationV2Data): Promise<IntegrationV2> {
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

      return integration as IntegrationV2
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create integration (V2)', error as Error)
    }
  }

  /**
   * Update an existing integration (V2)
   */
  async updateIntegration(id: string, data: UpdateIntegrationV2Data): Promise<IntegrationV2> {
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

      return integration as IntegrationV2
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to update integration ${id} (V2)`, error as Error)
    }
  }

  /**
   * Delete an integration (V2)
   */
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
   * Get integrations by organization (V2)
   */
  async getIntegrationsByOrganization(organizationId: string): Promise<IntegrationV2WithRelations[]> {
    return this.getIntegrations({ organizationId })
  }
}

// Export singleton instance following your pattern
export const integrationsServiceV2 = new IntegrationsServiceV2()
export default integrationsServiceV2
