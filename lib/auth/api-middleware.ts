/**
 * API Authentication Middleware
 * Provides authentication and authorization for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/database/clients';
import { usersService } from '@/lib/database/services';
import { Api } from '@/lib/api';
import type { ApiUser, UserRole } from '@/lib/types';

export interface AuthContext {
  user: ApiUser;
  token: string;
}

export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse>;

export type AuthenticatedHandlerWithParams = (
  request: NextRequest,
  context: AuthContext,
  routeContext: { params: Promise<{ id: string }> }
) => Promise<NextResponse>;

export type RoleBasedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse>;

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Authenticate user from token
 */
async function authenticateUser(token: string): Promise<ApiUser | null> {
  try {
    const supabase = createServerSupabaseClient();
    
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
 * Main authentication middleware
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract token
      const token = extractBearerToken(request);
      if (!token) {
        return Api.error(
          'AUTHENTICATION_ERROR',
          'Missing or invalid authorization header'
        );
      }

      // Authenticate user
      const user = await authenticateUser(token);
      if (!user) {
        return Api.error(
          'AUTHENTICATION_ERROR',
          'Invalid or expired token'
        );
      }

      // Create auth context
      const context: AuthContext = { user, token };

      // Call the actual handler
      return await handler(request, context);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return Api.internalError('Authentication failed');
    }
  };
}

/**
 * Authentication middleware for handlers with route params
 */
export function withAuthParams(handler: AuthenticatedHandlerWithParams) {
  return async (request: NextRequest, routeContext: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
    try {
      // Extract token
      const token = extractBearerToken(request);
      if (!token) {
        return Api.error(
          'AUTHENTICATION_ERROR',
          'Missing or invalid authorization header'
        );
      }

      // Authenticate user
      const user = await authenticateUser(token);
      if (!user) {
        return Api.error(
          'AUTHENTICATION_ERROR',
          'Invalid or expired token'
        );
      }

      // Create auth context
      const context: AuthContext = { user, token };

      // Call the actual handler
      return await handler(request, context, routeContext);
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return Api.internalError('Authentication failed');
    }
  };
}

/**
 * Role-based authentication middleware
 */
export function withRoles(allowedRoles: UserRole[], handler: RoleBasedHandler) {
  return withAuth(async (request: NextRequest, context: AuthContext) => {
    // Check if user has required role
    if (!allowedRoles.includes(context.user.role)) {
      return Api.error(
        'AUTHORIZATION_ERROR',
        'Insufficient permissions'
      );
    }

    return await handler(request, context);
  });
}

/**
 * Organization-scoped authentication middleware
 */
export function withOrganization(handler: RoleBasedHandler) {
  return withAuth(async (request: NextRequest, context: AuthContext) => {
    // Extract organization ID from URL params or request body
    const url = new URL(request.url);
    const orgIdFromPath = url.pathname.split('/').find(segment => 
      segment.match(/^[a-zA-Z0-9_-]+$/) && segment.length > 10
    );

    let requestedOrgId = orgIdFromPath;

    // If not in path, try to get from request body for POST/PUT requests
    if (!requestedOrgId && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.clone().json();
        requestedOrgId = body.organizationId;
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Super admins can access any organization
    if (context.user.role === 'SUPER_ADMIN') {
      return await handler(request, context);
    }

    // Regular users can only access their own organization
    if (requestedOrgId && context.user.organizationId !== requestedOrgId) {
      return Api.error(
        'AUTHORIZATION_ERROR',
        'Access denied to this organization'
      );
    }

    return await handler(request, context);
  });
}

/**
 * Public endpoint wrapper (no authentication required)
 */
export function withPublic(handler: (request: NextRequest) => Promise<NextResponse>) {
  return handler;
}

/**
 * Optional authentication middleware (user context if available)
 */
export function withOptionalAuth(
  handler: (request: NextRequest, context?: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const token = extractBearerToken(request);
      let context: AuthContext | undefined;

      if (token) {
        const user = await authenticateUser(token);
        if (user) {
          context = { user, token };
        }
      }

      return await handler(request, context);
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Continue without auth context on error
      return await handler(request);
    }
  };
}
