/**
 * Auth Middleware Utilities
 * Helper functions for authentication and authorization in API routes
 */

import { NextRequest } from 'next/server';
import { createClientSupabaseClient } from '@/lib/database/clients';
import { usersService } from '@/lib/database/services';
import type { ApiUser, UserRole, Permission } from '@/lib/types';
import { USER_PERMISSIONS } from '@/lib/types';

export interface AuthContext {
  user: ApiUser;
  token: string;
}

/**
 * Extract and validate bearer token from request
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Authenticate user from bearer token
 */
export async function authenticateUser(token: string): Promise<ApiUser | null> {
  try {
    const supabase = createClientSupabaseClient();
    
    // Verify token with Supabase
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
    
    if (error || !supabaseUser) {
      return null;
    }

    // Get user from our database
    const user = await usersService.getUserBySupabaseId(supabaseUser.id);
    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      supabaseId: user.supabaseId,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Get auth context from request
 */
export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  const user = await authenticateUser(token);
  if (!user) {
    return null;
  }

  return { user, token };
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = USER_PERMISSIONS[userRole];
  return (rolePermissions as readonly Permission[]).includes(permission);
}

/**
 * Check if user can access organization
 */
export function canAccessOrganization(user: ApiUser, organizationId: string): boolean {
  // Super admin can access any organization
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  // Users can only access their own organization
  return user.organizationId === organizationId;
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: NextRequest): Promise<{
  success: true;
  context: AuthContext;
} | {
  success: false;
  error: string;
  status: number;
}> {
  const context = await getAuthContext(request);
  
  if (!context) {
    return {
      success: false,
      error: 'Authentication required',
      status: 401
    };
  }

  return {
    success: true,
    context
  };
}

/**
 * Require specific role middleware
 */
export async function requireRole(
  request: NextRequest, 
  allowedRoles: UserRole[]
): Promise<{
  success: true;
  context: AuthContext;
} | {
  success: false;
  error: string;
  status: number;
}> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return authResult;
  }

  if (!allowedRoles.includes(authResult.context.user.role)) {
    return {
      success: false,
      error: 'Insufficient permissions',
      status: 403
    };
  }

  return authResult;
}

/**
 * Require organization access middleware
 */
export async function requireOrganizationAccess(
  request: NextRequest,
  organizationId: string
): Promise<{
  success: true;
  context: AuthContext;
} | {
  success: false;
  error: string;
  status: number;
}> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return authResult;
  }

  if (!canAccessOrganization(authResult.context.user, organizationId)) {
    return {
      success: false,
      error: 'Access denied to this organization',
      status: 403
    };
  }

  return authResult;
}