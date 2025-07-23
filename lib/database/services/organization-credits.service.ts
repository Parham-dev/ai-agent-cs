import { prisma } from '@/lib/database/database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  OrganizationCredits,
  OrganizationCreditsWithRelations,
  UpdateOrganizationCreditsData
} from '@/lib/types/database'

class OrganizationCreditsService {
  /**
   * Get organization credits by organization ID
   */
  async getOrganizationCredits(organizationId: string): Promise<OrganizationCreditsWithRelations | null> {
    try {
      const credits = await prisma.organizationCredits.findUnique({
        where: { organizationId },
        include: {
          organization: {
            select: { name: true, slug: true }
          }
        }
      })

      return credits as OrganizationCreditsWithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch credits for organization ${organizationId}`, error as Error)
    }
  }

  /**
   * Get organization credits or throw error if not found
   */
  async getOrganizationCreditsOrThrow(organizationId: string): Promise<OrganizationCreditsWithRelations> {
    const credits = await this.getOrganizationCredits(organizationId)
    if (!credits) {
      throw new NotFoundError('Organization credits', `organization ${organizationId}`)
    }
    return credits
  }

  /**
   * Initialize credits for a new organization with free credits
   */
  async initializeOrganizationCredits(organizationId: string): Promise<OrganizationCredits> {
    try {
      // Check if credits already exist
      const existing = await this.getOrganizationCredits(organizationId)
      if (existing) {
        return existing
      }

      // Create new credits with initial free credit
      const credits = await prisma.organizationCredits.create({
        data: {
          organizationId,
          credits: 0.30, // 30p initial credit
          freeCredits: 0.30,
          paidCredits: 0
        }
      })

      return credits as OrganizationCredits
    } catch (error) {
      throw new DatabaseError('Failed to initialize organization credits', error as Error)
    }
  }

  /**
   * Check if organization has sufficient credits
   */
  async hasAvailableCredits(organizationId: string, requiredAmount?: number): Promise<boolean> {
    try {
      const credits = await this.getOrganizationCredits(organizationId)
      
      // If no credits record exists, initialize it
      if (!credits) {
        await this.initializeOrganizationCredits(organizationId)
        return true // New organizations get free credits
      }

      // If no specific amount required, just check if there are any credits
      if (requiredAmount === undefined) {
        return credits.credits > 0
      }

      return credits.credits >= requiredAmount
    } catch (error) {
      throw new DatabaseError('Failed to check available credits', error as Error)
    }
  }

  /**
   * Add credits to organization (for purchases or refunds)
   */
  async addCredits(organizationId: string, amount: number, isPaidCredit: boolean = true): Promise<OrganizationCredits> {
    try {
      if (amount <= 0) {
        throw new ValidationError('Credit amount must be positive', 'amount')
      }

      // Ensure credits exist
      const credits = await this.getOrganizationCredits(organizationId)
      if (!credits) {
        await this.initializeOrganizationCredits(organizationId)
      }

      // Update credits
      const updateData: UpdateOrganizationCreditsData = {
        credits: { increment: amount } as never
      }

      if (isPaidCredit) {
        updateData.paidCredits = { increment: amount } as never
      } else {
        updateData.freeCredits = { increment: amount } as never
      }

      const updated = await prisma.organizationCredits.update({
        where: { organizationId },
        data: updateData as never
      })

      return updated as OrganizationCredits
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to add credits', error as Error)
    }
  }

  /**
   * Deduct credits from organization (for usage)
   */
  async deductCredits(organizationId: string, amount: number): Promise<OrganizationCredits> {
    try {
      if (amount <= 0) {
        throw new ValidationError('Deduction amount must be positive', 'amount')
      }

      // Check if sufficient credits exist
      const hasCredits = await this.hasAvailableCredits(organizationId, amount)
      if (!hasCredits) {
        throw new ValidationError('Insufficient credits', 'credits')
      }

      // Deduct credits
      const updated = await prisma.organizationCredits.update({
        where: { organizationId },
        data: {
          credits: { decrement: amount } as never
        }
      })

      return updated as OrganizationCredits
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to deduct credits', error as Error)
    }
  }

  /**
   * Get all organizations with low credits
   */
  async getOrganizationsWithLowCredits(threshold: number = 1.0): Promise<OrganizationCreditsWithRelations[]> {
    try {
      const credits = await prisma.organizationCredits.findMany({
        where: {
          credits: {
            lt: threshold
          }
        },
        include: {
          organization: {
            select: { name: true, slug: true }
          }
        },
        orderBy: { credits: 'asc' }
      })

      return credits as OrganizationCreditsWithRelations[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch organizations with low credits', error as Error)
    }
  }

  /**
   * Get credit statistics for organization
   */
  async getCreditStats(organizationId: string): Promise<{
    totalCredits: number
    freeCredits: number
    paidCredits: number
    usedCredits: number
  }> {
    try {
      const credits = await this.getOrganizationCredits(organizationId)
      
      if (!credits) {
        return {
          totalCredits: 0,
          freeCredits: 0,
          paidCredits: 0,
          usedCredits: 0
        }
      }

      const usedCredits = credits.freeCredits + credits.paidCredits - credits.credits

      return {
        totalCredits: credits.credits,
        freeCredits: credits.freeCredits,
        paidCredits: credits.paidCredits,
        usedCredits: Math.max(0, usedCredits)
      }
    } catch (error) {
      throw new DatabaseError('Failed to get credit statistics', error as Error)
    }
  }

  /**
   * Reset credits (for testing or admin purposes)
   */
  async resetCredits(organizationId: string, newBalance: number = 0.30): Promise<OrganizationCredits> {
    try {
      if (newBalance < 0) {
        throw new ValidationError('Credit balance cannot be negative', 'newBalance')
      }

      const updated = await prisma.organizationCredits.upsert({
        where: { organizationId },
        create: {
          organizationId,
          credits: newBalance,
          freeCredits: newBalance,
          paidCredits: 0
        },
        update: {
          credits: newBalance,
          freeCredits: newBalance,
          paidCredits: 0
        }
      })

      return updated as OrganizationCredits
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to reset credits', error as Error)
    }
  }
}

// Export singleton instance
export const organizationCreditsService = new OrganizationCreditsService()