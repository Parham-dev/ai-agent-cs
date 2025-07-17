import { prisma } from '@/lib/database/database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  Organization,
  OrganizationWithStats,
  OrganizationWithRelations,
  CreateOrganizationData,
  UpdateOrganizationData,
  OrganizationFilters
} from '@/lib/types/database'

class OrganizationsService {
  /**
   * Get all organizations with optional filtering and pagination   */
  async getOrganizations(filters: OrganizationFilters = {}): Promise<OrganizationWithStats[]> {
    try {
      const {
        search,
        limit = 20,
        offset = 0
      } = filters

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { slug: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } }
          ]
        })
      }

      const organizations = await prisma.organization.findMany({
        where,
        include: {
          _count: {
            select: { 
              agents: true,
              integrations: true,
              conversations: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })

      return organizations as OrganizationWithStats[]
    } catch (error) {
      throw new DatabaseError('Failed to fetch organizations (V2)', error as Error)
    }
  }

  /**
   * Get a single organization by ID   */
  async getOrganizationById(id: string): Promise<OrganizationWithStats | null> {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id },
        include: {
          _count: {
            select: { 
              agents: true,
              integrations: true,
              conversations: true
            }
          }
        }
      })

      return organization as OrganizationWithStats | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch organization ${id} (V2)`, error as Error)
    }
  }

  /**
   * Get organization by slug   */
  async getOrganizationBySlug(slug: string): Promise<OrganizationWithStats | null> {
    try {
      const organization = await prisma.organization.findUnique({
        where: { slug },
        include: {
          _count: {
            select: { 
              agents: true,
              integrations: true,
              conversations: true
            }
          }
        }
      })

      return organization as OrganizationWithStats | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch organization with slug ${slug} (V2)`, error as Error)
    }
  }

  /**
   * Get organization by ID or throw error if not found   */
  async getOrganizationByIdOrThrow(id: string): Promise<OrganizationWithStats> {
    const organization = await this.getOrganizationById(id)
    if (!organization) {
      throw new NotFoundError('Organization', id)
    }
    return organization
  }

  /**
   * Get organization with full relations (agents, integrations)   */
  async getOrganizationWithRelations(id: string): Promise<OrganizationWithRelations | null> {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id },
        include: {
          agents: {
            select: {
              id: true,
              name: true,
              isActive: true
            },
            where: { isActive: true }
          },
          integrations: {
            select: {
              id: true,
              type: true,
              name: true,
              isActive: true
            }
          }
        }
      })

      return organization as OrganizationWithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch organization ${id} with relations (V2)`, error as Error)
    }
  }

  /**
   * Create a new organization   */
  async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        throw new ValidationError('Organization name is required', 'name')
      }
      if (!data.slug?.trim()) {
        throw new ValidationError('Organization slug is required', 'slug')
      }

      // Validate slug format (URL-friendly)
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(data.slug)) {
        throw new ValidationError('Slug must contain only lowercase letters, numbers, and hyphens', 'slug')
      }

      // Check if slug already exists
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: data.slug }
      })
      if (existingOrg) {
        throw new ValidationError('Organization slug already exists', 'slug')
      }

      const organization = await prisma.organization.create({
        data: {
          name: data.name.trim(),
          slug: data.slug.trim(),
          description: data.description?.trim() || null
        }
      })

      return organization as Organization
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError('Failed to create organization (V2)', error as Error)
    }
  }

  /**
   * Update an existing organization   */
  async updateOrganization(id: string, data: UpdateOrganizationData): Promise<Organization> {
    try {
      // Check if organization exists
      await this.getOrganizationByIdOrThrow(id)

      // If updating slug, validate format and uniqueness
      if (data.slug) {
        const slugRegex = /^[a-z0-9-]+$/
        if (!slugRegex.test(data.slug)) {
          throw new ValidationError('Slug must contain only lowercase letters, numbers, and hyphens', 'slug')
        }

        const existingOrg = await prisma.organization.findUnique({
          where: { slug: data.slug }
        })
        if (existingOrg && existingOrg.id !== id) {
          throw new ValidationError('Organization slug already exists', 'slug')
        }
      }

      const organization = await prisma.organization.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.slug && { slug: data.slug.trim() }),
          ...(data.description !== undefined && { description: data.description?.trim() || null })
        }
      })

      return organization as Organization
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError(`Failed to update organization ${id} (V2)`, error as Error)
    }
  }

  /**
   * Delete an organization (this will cascade delete related data)   */
  async deleteOrganization(id: string): Promise<void> {
    try {
      // Check if organization exists
      await this.getOrganizationByIdOrThrow(id)

      await prisma.organization.delete({
        where: { id }
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new DatabaseError(`Failed to delete organization ${id} (V2)`, error as Error)
    }
  }

  /**
   * Get organizations count   */
  async getOrganizationsCount(): Promise<number> {
    try {
      return await prisma.organization.count()
    } catch (error) {
      throw new DatabaseError('Failed to count organizations (V2)', error as Error)
    }
  }

  /**
   * Check if slug is available   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const organization = await prisma.organization.findUnique({
        where: { slug }
      })
      
      return !organization || (!!excludeId && organization.id === excludeId)
    } catch (error) {
      throw new DatabaseError('Failed to check slug availability (V2)', error as Error)
    }
  }
}

// Export singleton instance
export const organizationsService = new OrganizationsService()