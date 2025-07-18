/**
 * User Database Service
 * Handles all user-related database operations
 */

import { prisma } from '@/lib/database/database'
import type { 
  DbUser, 
  CreateUserData, 
  UpdateUserData, 
  UserFilters 
} from '@/lib/types';

export class UsersService {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<DbUser | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        organization: true
      }
    });
  }

  /**
   * Get user by Supabase ID
   */
  async getUserBySupabaseId(supabaseId: string): Promise<DbUser | null> {
    return prisma.user.findUnique({
      where: { supabaseId },
      include: {
        organization: true
      }
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<DbUser | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        organization: true
      }
    });
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserData): Promise<DbUser> {
    return prisma.user.create({
      data: {
        supabaseId: data.supabaseId,
        email: data.email,
        name: data.name,
        role: data.role || 'USER',
        organizationId: data.organizationId
      },
      include: {
        organization: true
      }
    });
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<DbUser> {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        organization: true
      }
    });
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  async deleteUser(id: string): Promise<DbUser> {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: {
        organization: true
      }
    });
  }

  /**
   * List users with filters and pagination
   */
  async getUsers(
    filters: UserFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ users: DbUser[]; total: number }> {
    const where: Record<string, unknown> = {};

    // Apply filters
    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          organization: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return { users, total };
  }

  /**
   * Get users by organization
   */
  async getUsersByOrganization(organizationId: string): Promise<DbUser[]> {
    return prisma.user.findMany({
      where: { organizationId },
      include: {
        organization: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Check if user exists by email
   */
  async userExistsByEmail(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    return !!user;
  }

  /**
   * Sync user from Supabase (create or update)
   */
  async syncUserFromSupabase(supabaseUser: {
    id: string;
    email: string;
    user_metadata?: { name?: string };
  }): Promise<DbUser> {
    const existingUser = await this.getUserBySupabaseId(supabaseUser.id);

    if (existingUser) {
      // Update existing user
      return this.updateUser(existingUser.id, {
        name: supabaseUser.user_metadata?.name ?? existingUser.name ?? undefined
      });
    } else {
      // Create new user
      return this.createUser({
        supabaseId: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.name
      });
    }
  }
}

export const usersService = new UsersService();