import { prisma } from '../database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import '../../types/prisma-json'

// Define Integration type based on our schema
export interface Integration {
  id: string
  organizationId: string
  type: string
  name: string
  credentials: PrismaJson.IntegrationCredentials
  settings: PrismaJson.IntegrationSettings
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Extended types for better API responses
export interface IntegrationWithOrganization extends Integration {
  organization?: {
    id: string
    name: string
    slug: string
  }
}

export interface CreateIntegrationData {
  organizationId: string
  type: string
  name: string
  credentials?: PrismaJson.IntegrationCredentials
  settings?: PrismaJson.IntegrationSettings
  isActive?: boolean
}

export interface UpdateIntegrationData {
  name?: string
  credentials?: PrismaJson.IntegrationCredentials
  settings?: PrismaJson.IntegrationSettings
  isActive?: boolean
}

export interface IntegrationFilters {
  organizationId?: string
  type?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

// Supported integration types
export const INTEGRATION_TYPES = {
  SHOPIFY: 'shopify',
  STRIPE: 'stripe', 
  WOOCOMMERCE: 'woocommerce',
  MAGENTO: 'magento',
  BIGCOMMERCE: 'bigcommerce',
  SQUARESPACE: 'squarespace',
  WORDPRESS: 'wordpress',
  SALESFORCE: 'salesforce',
  HUBSPOT: 'hubspot',
  ZENDESK: 'zendesk',
  INTERCOM: 'intercom',
  SLACK: 'slack',
  DISCORD: 'discord',
  MCP_SERVER: 'mcp_server',
  CUSTOM_API: 'custom_api'
} as const

export type IntegrationType = typeof INTEGRATION_TYPES[keyof typeof INTEGRATION_TYPES]

class IntegrationsService {
  /**
   * Get all integrations with optional filtering and pagination
   */
  async getIntegrations(filters: IntegrationFilters = {}): Promise<IntegrationWithOrganization[]> {
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
            { type: { contains: search, mode: 'insensitive' as const } }
          ]
        })
      }

      const integrations = await prisma.integration.findMany({
        where,
        include: {
          organization: {
            select: { id: true, name: true, slug: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return integrations
    } catch (error) {
      throw new DatabaseError('Failed to fetch integrations', error as Error)
    }
  }

  /**
   * Get a single integration by ID
   */
  async getIntegrationById(id: string): Promise<IntegrationWithOrganization | null> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { id },
        include: {
          organization: {
            select: { id: true, name: true, slug: true }
          }
        }
      })

      return integration
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integration ${id}`, error as Error)
    }
  }

  /**
   * Get integration by ID or throw error if not found
   */
  async getIntegrationByIdOrThrow(id: string): Promise<IntegrationWithOrganization> {
    const integration = await this.getIntegrationById(id)
    if (!integration) {
      throw new NotFoundError('Integration', id)
    }
    return integration
  }

  /**
   * Get integrations by organization
   */
  async getIntegrationsByOrganization(organizationId: string): Promise<Integration[]> {
    try {
      return await prisma.integration.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integrations for organization ${organizationId}`, error as Error)
    }
  }

  /**
   * Get active integrations by organization and type
   */
  async getActiveIntegrationsByType(organizationId: string, type: string): Promise<Integration[]> {
    try {
      return await prisma.integration.findMany({
        where: {
          organizationId,
          type,
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      throw new DatabaseError(`Failed to fetch active ${type} integrations for organization ${organizationId}`, error as Error)
    }
  }

  /**
   * Get integration by organization, type, and name (unique constraint)
   */
  async getIntegrationByUniqueKey(
    organizationId: string, 
    type: string, 
    name: string
  ): Promise<Integration | null> {
    try {
      return await prisma.integration.findUnique({
        where: {
          organizationId_type_name: {
            organizationId,
            type,
            name
          }
        }
      })
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integration ${organizationId}/${type}/${name}`, error as Error)
    }
  }

  /**
   * Create a new integration
   */
  async createIntegration(data: CreateIntegrationData): Promise<Integration> {
    try {
      // Validate required fields
      if (!data.organizationId?.trim()) {
        throw new ValidationError('Organization ID is required', 'organizationId')
      }
      if (!data.type?.trim()) {
        throw new ValidationError('Integration type is required', 'type')
      }
      if (!data.name?.trim()) {
        throw new ValidationError('Integration name is required', 'name')
      }

      // Validate integration type
      const validTypes = Object.values(INTEGRATION_TYPES)
      if (!validTypes.includes(data.type as IntegrationType)) {
        throw new ValidationError(`Invalid integration type. Must be one of: ${validTypes.join(', ')}`, 'type')
      }

      // Check if integration with same org/type/name already exists
      const existingIntegration = await this.getIntegrationByUniqueKey(
        data.organizationId,
        data.type,
        data.name
      )
      if (existingIntegration) {
        throw new ValidationError('Integration with this name already exists for this type', 'name')
      }

      const integration = await prisma.integration.create({
        data: {
          organizationId: data.organizationId,
          type: data.type.toLowerCase(),
          name: data.name.trim(),
          credentials: data.credentials || {},
          settings: data.settings || {},
          isActive: data.isActive ?? true
        }
      })

      return integration
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create integration', error as Error)
    }
  }

  /**
   * Update an existing integration
   */
  async updateIntegration(id: string, data: UpdateIntegrationData): Promise<Integration> {
    try {
      // Check if integration exists
      const existingIntegration = await this.getIntegrationByIdOrThrow(id)

      // If updating name, check uniqueness
      if (data.name && data.name !== existingIntegration.name) {
        const conflictingIntegration = await this.getIntegrationByUniqueKey(
          existingIntegration.organizationId,
          existingIntegration.type,
          data.name
        )
        if (conflictingIntegration && conflictingIntegration.id !== id) {
          throw new ValidationError('Integration with this name already exists for this type', 'name')
        }
      }

      const integration = await prisma.integration.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.credentials && { credentials: data.credentials }),
          ...(data.settings && { settings: data.settings }),
          ...(typeof data.isActive === 'boolean' && { isActive: data.isActive })
        }
      })

      return integration
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError(`Failed to update integration ${id}`, error as Error)
    }
  }

  /**
   * Delete an integration
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
      throw new DatabaseError(`Failed to delete integration ${id}`, error as Error)
    }
  }

  /**
   * Toggle integration active status
   */
  async toggleIntegrationStatus(id: string): Promise<Integration> {
    try {
      const integration = await this.getIntegrationByIdOrThrow(id)
      
      return await this.updateIntegration(id, { isActive: !integration.isActive })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to toggle integration status ${id}`, error as Error)
    }
  }

  /**
   * Update integration credentials (encrypted storage)
   */
  async updateIntegrationCredentials(id: string, credentials: PrismaJson.IntegrationCredentials): Promise<Integration> {
    try {
      const integration = await this.getIntegrationByIdOrThrow(id)
      
      // In production, credentials should be encrypted before storage
      // For now, we'll merge with existing credentials
      const updatedCredentials = {
        ...integration.credentials,
        ...credentials
      }

      return await this.updateIntegration(id, { credentials: updatedCredentials })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to update integration credentials ${id}`, error as Error)
    }
  }

  /**
   * Update integration settings
   */
  async updateIntegrationSettings(id: string, settings: PrismaJson.IntegrationSettings): Promise<Integration> {
    try {
      const integration = await this.getIntegrationByIdOrThrow(id)
      
      // Merge with existing settings
      const updatedSettings = {
        ...integration.settings,
        ...settings
      }

      return await this.updateIntegration(id, { settings: updatedSettings })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to update integration settings ${id}`, error as Error)
    }
  }

  /**
   * Get integrations count by organization and type
   */
  async getIntegrationsCount(organizationId?: string, type?: string, isActive?: boolean): Promise<number> {
    try {
      return await prisma.integration.count({
        where: {
          ...(organizationId && { organizationId }),
          ...(type && { type }),
          ...(typeof isActive === 'boolean' && { isActive })
        }
      })
    } catch (error) {
      throw new DatabaseError('Failed to count integrations', error as Error)
    }
  }

  /**
   * Get available integration types
   */
  getAvailableIntegrationTypes(): typeof INTEGRATION_TYPES {
    return INTEGRATION_TYPES
  }

  /**
   * Validate integration credentials (placeholder for specific validation logic)
   */
  async validateIntegrationCredentials(type: string, credentials: PrismaJson.IntegrationCredentials): Promise<{ isValid: boolean; message: string }> {
    try {
      // This would contain type-specific validation logic
      // For now, return a basic validation
      switch (type.toLowerCase()) {
        case INTEGRATION_TYPES.SHOPIFY:
          if (!credentials.storeDomain || !credentials.accessToken) {
            return { isValid: false, message: 'Shopify integration requires storeDomain and accessToken' }
          }
          break
        case INTEGRATION_TYPES.STRIPE:
          if (!credentials.secretKey) {
            return { isValid: false, message: 'Stripe integration requires secretKey' }
          }
          break
        default:
          // Generic validation
          if (!credentials || Object.keys(credentials).length === 0) {
            return { isValid: false, message: 'Integration credentials are required' }
          }
      }

      return { isValid: true, message: 'Credentials are valid' }
    } catch (error) {
      throw new DatabaseError('Failed to validate integration credentials', error as Error)
    }
  }

  /**
   * Get integrations by multiple types (useful for dashboard overview)
   */
  async getIntegrationsByTypes(organizationId: string, types: string[]): Promise<Integration[]> {
    try {
      return await prisma.integration.findMany({
        where: {
          organizationId,
          type: { in: types }
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      throw new DatabaseError(`Failed to fetch integrations by types for organization ${organizationId}`, error as Error)
    }
  }
}

// Export singleton instance
export const integrationsService = new IntegrationsService()