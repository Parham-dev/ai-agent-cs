import { prisma } from '@/lib/database/database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import { encryptionService } from '@/lib/services'
import { logger } from '@/lib/utils/logger'
import { IntegrationCredentials, CustomMcpCredentials } from '@/lib/types/integrations'
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
  async getIntegrations(filters: Omit<IntegrationFilters, 'organizationId'> = {}, organizationId: string): Promise<IntegrationWithRelations[]> {
    try {
      const {
        type,
        isActive,
        search,
        limit = 20,
        offset = 0
      } = filters

      const where = {
        organizationId,
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

      // Decrypt credentials for each integration
      const decryptedIntegrations = await Promise.all(
        integrations.map(async (integration) => {
          try {
            const decryptedCredentials = await encryptionService.decryptCredentials<IntegrationCredentials | CustomMcpCredentials>(
              integration.credentials
            )
            return {
              ...integration,
              credentials: decryptedCredentials
            }
          } catch (error) {
            // Log error but return integration with empty credentials to not break the flow
            console.error(`Failed to decrypt credentials for integration ${integration.id}:`, error)
            return {
              ...integration,
              credentials: {}
            }
          }
        })
      )

      return decryptedIntegrations as IntegrationWithRelations[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch integrations (V2)', error as Error)
    }
  }

  /**
   * Get a single integration by ID   */
  async getIntegrationById(id: string, organizationId: string): Promise<IntegrationWithRelations | null> {
    try {
      const integration = await prisma.integration.findFirst({
        where: { 
          id,
          organizationId 
        },
        include: {
          organization: {
            select: { name: true, slug: true }
          },
          agentIntegrations: {
            select: { agentId: true, isEnabled: true, selectedTools: true }
          }
        }
      })

      if (!integration) {
        return null
      }

      // Decrypt credentials
      try {
        const decryptedCredentials = await encryptionService.decryptCredentials<IntegrationCredentials | CustomMcpCredentials>(
          integration.credentials
        )
        return {
          ...integration,
          credentials: decryptedCredentials
        } as IntegrationWithRelations
      } catch (error) {
        console.error(`Failed to decrypt credentials for integration ${integration.id}:`, error)
        logger.error('Credential decryption failed', { 
          integrationId: integration.id, 
          integrationType: integration.type,
          credentialsStructure: typeof integration.credentials,
          error: error instanceof Error ? error.message : String(error)
        }, error as Error)
        return {
          ...integration,
          credentials: {}
        } as IntegrationWithRelations
      }
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integration ${id} (V2)`, error as Error)
    }
  }

  /**
   * Get integration by ID or throw error if not found   */
  async getIntegrationByIdOrThrow(id: string, organizationId: string): Promise<IntegrationWithRelations> {
    const integration = await this.getIntegrationById(id, organizationId)
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
      // Since we changed the unique constraint to include name, use findFirst for this query
      const integration = await prisma.integration.findFirst({
        where: {
          organizationId,
          type
        }
      })

      if (!integration) {
        return null
      }

      // Decrypt credentials
      try {
        const decryptedCredentials = await encryptionService.decryptCredentials<IntegrationCredentials | CustomMcpCredentials>(
          integration.credentials
        )
        return {
          ...integration,
          credentials: decryptedCredentials
        } as Integration
      } catch (error) {
        console.error(`Failed to decrypt credentials for integration ${integration.id}:`, error)
        return {
          ...integration,
          credentials: {}
        } as Integration
      }
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integration ${type} for organization ${organizationId} (V2)`, error as Error)
    }
  }

  /**
   * Create a new integration   */
  async createIntegration(data: Omit<CreateIntegrationData, 'organizationId'>, organizationId: string): Promise<Integration> {
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new ValidationError('Integration name is required', 'name')
      }
      if (!data.type?.trim()) {
        throw new ValidationError('Integration type is required', 'type')
      }
      if (!data.credentials || Object.keys(data.credentials).length === 0) {
        throw new ValidationError('Integration credentials are required', 'credentials')
      }

      // Check if integration already exists
      if (data.type === 'custom-mcp') {
        // For custom MCP, check by organizationId, type, and name to allow multiple
        const existingCustomMcp = await prisma.integration.findFirst({
          where: {
            organizationId,
            type: data.type,
            name: data.name.trim()
          }
        })
        
        if (existingCustomMcp) {
          // Update existing custom MCP with same name
          return this.updateIntegration(existingCustomMcp.id, {
            credentials: data.credentials,
            description: data.description
          }, organizationId)
        }
      } else {
        // For other integrations, maintain single instance per type
        const existingIntegration = await this.getIntegrationByOrganizationAndType(
          organizationId, 
          data.type
        )
        
        if (existingIntegration) {
          // If integration exists, update its credentials instead of creating new one
          return this.updateIntegration(existingIntegration.id, {
            credentials: data.credentials,
            name: data.name,
            description: data.description
          }, organizationId)
        }
      }

      // Encrypt credentials before storing
      const encryptedCredentials = await encryptionService.encryptCredentials(
        data.credentials as IntegrationCredentials | CustomMcpCredentials
      )

      const integration = await prisma.integration.create({
        data: {
          organizationId: organizationId,
          name: data.name.trim(),
          type: data.type.trim(),
          description: data.description?.trim() || null,
          credentials: encryptedCredentials as unknown as Record<string, unknown>,
          isActive: data.isActive ?? true
        }
      })

      // Return with decrypted credentials
      return {
        ...integration,
        credentials: data.credentials
      } as Integration
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create integration (V2)', error as Error)
    }
  }

  /**
   * Update an existing integration   */
  async updateIntegration(id: string, data: UpdateIntegrationData, organizationId: string): Promise<Integration> {
    try {
      // Check if integration exists
      await this.getIntegrationByIdOrThrow(id, organizationId)

      const updateData: Record<string, unknown> = {}
      
      if (data.name !== undefined) updateData.name = data.name.trim()
      if (data.description !== undefined) updateData.description = data.description?.trim() || null
      if (data.credentials !== undefined) {
        // Encrypt new credentials
        const encryptedCredentials = await encryptionService.encryptCredentials(
          data.credentials as IntegrationCredentials | CustomMcpCredentials
        )
        updateData.credentials = encryptedCredentials as unknown as Record<string, unknown>
      }
      if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive

      const integration = await prisma.integration.update({
        where: { 
          id,
          organizationId
        },
        data: updateData
      })

      // Return with decrypted credentials if they were updated
      if (data.credentials !== undefined) {
        return {
          ...integration,
          credentials: data.credentials
        } as Integration
      }

      // Otherwise decrypt the stored credentials
      try {
        const decryptedCredentials = await encryptionService.decryptCredentials<IntegrationCredentials | CustomMcpCredentials>(
          integration.credentials
        )
        return {
          ...integration,
          credentials: decryptedCredentials
        } as Integration
      } catch (error) {
        console.error(`Failed to decrypt credentials for integration ${integration.id}:`, error)
        return {
          ...integration,
          credentials: {}
        } as Integration
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to update integration ${id} (V2)`, error as Error)
    }
  }

  /**
   * Delete an integration   */
  async deleteIntegration(id: string, organizationId: string): Promise<void> {
    try {
      // Check if integration exists
      await this.getIntegrationByIdOrThrow(id, organizationId)

      await prisma.integration.delete({
        where: { 
          id,
          organizationId
        }
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
    return this.getIntegrations({}, organizationId)
  }
}

// Export singleton instance
export const integrationsService = new IntegrationsService()
