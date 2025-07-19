import { prisma } from '@/lib/database/database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  BillingConfig,
  BillingConfigWithRelations,
  CreateBillingConfigData,
  UpdateBillingConfigData
} from '@/lib/types/database'

class BillingConfigsService {
  /**
   * Get billing config by organization ID
   */
  async getBillingConfigByOrganization(organizationId: string): Promise<BillingConfigWithRelations | null> {
    try {
      const billingConfig = await prisma.billingConfig.findUnique({
        where: { organizationId },
        include: {
          organization: {
            select: { name: true, slug: true }
          }
        }
      })

      return billingConfig as BillingConfigWithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch billing config for organization ${organizationId}`, error as Error)
    }
  }

  /**
   * Get billing config by organization ID or throw error if not found
   */
  async getBillingConfigByOrganizationOrThrow(organizationId: string): Promise<BillingConfigWithRelations> {
    const billingConfig = await this.getBillingConfigByOrganization(organizationId)
    if (!billingConfig) {
      throw new NotFoundError('Billing config', `organization ${organizationId}`)
    }
    return billingConfig
  }

  /**
   * Get billing config by ID
   */
  async getBillingConfigById(id: string): Promise<BillingConfigWithRelations | null> {
    try {
      const billingConfig = await prisma.billingConfig.findUnique({
        where: { id },
        include: {
          organization: {
            select: { name: true, slug: true }
          }
        }
      })

      return billingConfig as BillingConfigWithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch billing config ${id}`, error as Error)
    }
  }

  /**
   * Create or update billing config for organization
   */
  async upsertBillingConfig(organizationId: string, data: CreateBillingConfigData): Promise<BillingConfig> {
    try {
      // Validate required fields
      if (!organizationId) {
        throw new ValidationError('Organization ID is required', 'organizationId')
      }

      // Validate budget values
      if (data.monthlyBudget !== undefined && data.monthlyBudget !== null && data.monthlyBudget < 0) {
        throw new ValidationError('Monthly budget cannot be negative', 'monthlyBudget')
      }
      if (data.alertThreshold !== undefined && (data.alertThreshold < 0 || data.alertThreshold > 1)) {
        throw new ValidationError('Alert threshold must be between 0 and 1', 'alertThreshold')
      }
      if (data.maxCostPerMessage !== undefined && data.maxCostPerMessage !== null && data.maxCostPerMessage < 0) {
        throw new ValidationError('Max cost per message cannot be negative', 'maxCostPerMessage')
      }

      const billingConfig = await prisma.billingConfig.upsert({
        where: { organizationId },
        create: {
          organizationId,
          monthlyBudget: data.monthlyBudget || null,
          alertThreshold: data.alertThreshold ?? 0.8,
          preferredModel: data.preferredModel || 'gpt-4o-mini',
          autoOptimize: data.autoOptimize ?? false,
          maxCostPerMessage: data.maxCostPerMessage || null,
          emailAlerts: data.emailAlerts ?? true,
          alertEmail: data.alertEmail?.trim() || null
        },
        update: {
          monthlyBudget: data.monthlyBudget ?? undefined,
          alertThreshold: data.alertThreshold ?? undefined,
          preferredModel: data.preferredModel ?? undefined,
          autoOptimize: data.autoOptimize ?? undefined,
          maxCostPerMessage: data.maxCostPerMessage ?? undefined,
          emailAlerts: data.emailAlerts ?? undefined,
          alertEmail: data.alertEmail?.trim() ?? undefined
        }
      })

      return billingConfig as BillingConfig
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to upsert billing config', error as Error)
    }
  }

  /**
   * Update billing config
   */
  async updateBillingConfig(organizationId: string, data: UpdateBillingConfigData): Promise<BillingConfig> {
    try {
      // Check if billing config exists
      await this.getBillingConfigByOrganizationOrThrow(organizationId)

      // Validate values
      if (data.monthlyBudget !== undefined && data.monthlyBudget !== null && data.monthlyBudget < 0) {
        throw new ValidationError('Monthly budget cannot be negative', 'monthlyBudget')
      }
      if (data.alertThreshold !== undefined && (data.alertThreshold < 0 || data.alertThreshold > 1)) {
        throw new ValidationError('Alert threshold must be between 0 and 1', 'alertThreshold')
      }
      if (data.maxCostPerMessage !== undefined && data.maxCostPerMessage !== null && data.maxCostPerMessage < 0) {
        throw new ValidationError('Max cost per message cannot be negative', 'maxCostPerMessage')
      }

      const updateData: Record<string, unknown> = {}
      
      if (data.monthlyBudget !== undefined) updateData.monthlyBudget = data.monthlyBudget
      if (data.alertThreshold !== undefined) updateData.alertThreshold = data.alertThreshold
      if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
      if (data.preferredModel !== undefined) updateData.preferredModel = data.preferredModel
      if (typeof data.autoOptimize === 'boolean') updateData.autoOptimize = data.autoOptimize
      if (data.maxCostPerMessage !== undefined) updateData.maxCostPerMessage = data.maxCostPerMessage
      if (typeof data.emailAlerts === 'boolean') updateData.emailAlerts = data.emailAlerts
      if (data.alertEmail !== undefined) updateData.alertEmail = data.alertEmail?.trim() || null

      const billingConfig = await prisma.billingConfig.update({
        where: { organizationId },
        data: updateData
      })

      return billingConfig as BillingConfig
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError(`Failed to update billing config for organization ${organizationId}`, error as Error)
    }
  }

  /**
   * Delete billing config
   */
  async deleteBillingConfig(organizationId: string): Promise<void> {
    try {
      // Check if billing config exists
      await this.getBillingConfigByOrganizationOrThrow(organizationId)

      await prisma.billingConfig.delete({
        where: { organizationId }
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to delete billing config for organization ${organizationId}`, error as Error)
    }
  }

  /**
   * Get all billing configs with pagination
   */
  async getBillingConfigs(limit: number = 50, offset: number = 0): Promise<BillingConfigWithRelations[]> {
    try {
      const billingConfigs = await prisma.billingConfig.findMany({
        include: {
          organization: {
            select: { name: true, slug: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return billingConfigs as BillingConfigWithRelations[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch billing configs', error as Error)
    }
  }

  /**
   * Get organizations with budget alerts
   */
  async getOrganizationsWithBudgetAlerts(): Promise<BillingConfigWithRelations[]> {
    try {
      const billingConfigs = await prisma.billingConfig.findMany({
        where: {
          isActive: true,
          emailAlerts: true,
          monthlyBudget: {
            not: null
          }
        },
        include: {
          organization: {
            select: { name: true, slug: true }
          }
        }
      })

      return billingConfigs as BillingConfigWithRelations[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch organizations with budget alerts', error as Error)
    }
  }

  /**
   * Check if organization has auto-optimization enabled
   */
  async hasAutoOptimization(organizationId: string): Promise<boolean> {
    try {
      const billingConfig = await this.getBillingConfigByOrganization(organizationId)
      return billingConfig?.autoOptimize ?? false
    } catch {
      // If no billing config exists, return false
      return false
    }
  }

  /**
   * Get preferred model for organization
   */
  async getPreferredModel(organizationId: string): Promise<string> {
    try {
      const billingConfig = await this.getBillingConfigByOrganization(organizationId)
      return billingConfig?.preferredModel ?? 'gpt-4o-mini'
    } catch {
      // If no billing config exists, return default
      return 'gpt-4o-mini'
    }
  }

  /**
   * Get budget information for organization
   */
  async getBudgetInfo(organizationId: string): Promise<{
    monthlyBudget: number | null
    alertThreshold: number
    maxCostPerMessage: number | null
    emailAlerts: boolean
    alertEmail: string | null
  }> {
    try {
      const billingConfig = await this.getBillingConfigByOrganization(organizationId)
      
      return {
        monthlyBudget: billingConfig?.monthlyBudget ?? null,
        alertThreshold: billingConfig?.alertThreshold ?? 0.8,
        maxCostPerMessage: billingConfig?.maxCostPerMessage ?? null,
        emailAlerts: billingConfig?.emailAlerts ?? true,
        alertEmail: billingConfig?.alertEmail ?? null
      }
    } catch {
      // Return defaults if no billing config exists
      return {
        monthlyBudget: null,
        alertThreshold: 0.8,
        maxCostPerMessage: null,
        emailAlerts: true,
        alertEmail: null
      }
    }
  }
}

// Export singleton instance
export const billingConfigsService = new BillingConfigsService()
