/**
 * Ultra-Simplified JWT-Based Authentication
 * No database lookups - everything from JWT metadata!
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/database/clients';
import { Api } from '@/lib/api';
import type { UserRole, AuthContext, JWTMetadata } from '@/lib/types/auth';

/**
 * Extract and verify JWT, return user context from metadata
 * ZERO database lookups! 🚀
 */
async function getUserFromJWT(request: NextRequest): Promise<AuthContext['user'] | null> {
  try {
    // Extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const supabase = createServerSupabaseClient();
    
    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get everything from JWT metadata - no DB lookup needed!
    const metadata = user.app_metadata as JWTMetadata;
    
    if (!metadata.userId || !metadata.role) {
      console.warn('User JWT missing required metadata:', user.id);
      return null;
    }

    return {
      id: metadata.userId,
      supabaseId: user.id,
      email: user.email!,
      name: user.user_metadata?.name || null,
      role: metadata.role,
      organizationId: metadata.organizationId,
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Main authentication middleware - ultra simple!
 */
export function withAuth(handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getUserFromJWT(request);
    
    if (!user) {
      return Api.error('AUTHENTICATION_ERROR', 'Authentication required');
    }

    return handler(request, { user });
  };
}

/**
 * Authentication with route params
 */
export function withAuthParams(
  handler: (request: NextRequest, context: AuthContext, routeContext: { params: Promise<{ id: string }> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, routeContext: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
    const user = await getUserFromJWT(request);
    
    if (!user) {
      return Api.error('AUTHENTICATION_ERROR', 'Authentication required');
    }

    return handler(request, { user }, routeContext);
  };
}

/**
 * Role-based authentication
 */
export function withRoles(allowedRoles: UserRole[], handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
  return withAuth(async (request: NextRequest, context: AuthContext) => {
    if (!allowedRoles.includes(context.user.role)) {
      return Api.error('AUTHORIZATION_ERROR', 'Insufficient permissions');
    }

    return handler(request, context);
  });
}

/**
 * Auto organization scoping - filters by user's org automatically
 * No more manual organizationId injection! 🎉
 */
export function withOrgScoping(handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
  return withAuth(async (request: NextRequest, context: AuthContext) => {
    // Automatically inject organizationId into query params for non-super-admins
    if (context.user.role !== 'SUPER_ADMIN' && context.user.organizationId) {
      const url = new URL(request.url);
      if (!url.searchParams.has('organizationId')) {
        url.searchParams.set('organizationId', context.user.organizationId);
        // Update the request URL for downstream handlers
        Object.defineProperty(request, 'url', { value: url.toString() });
      }
    }

    return handler(request, context);
  });
}

/**
 * Optional auth - user context if available
 */
export function withOptionalAuth(
  handler: (request: NextRequest, context?: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getUserFromJWT(request);
    const context = user ? { user } : undefined;
    return handler(request, context);
  };
}

// Helper to update user metadata in JWT
export async function updateUserJWTMetadata(supabaseUserId: string, metadata: Partial<JWTMetadata>) {
  const supabase = createServerSupabaseClient();
  
  const { error } = await supabase.auth.admin.updateUserById(supabaseUserId, {
    app_metadata: metadata
  });

  if (error) {
    throw new Error(`Failed to update JWT metadata: ${error.message}`);
  }
}

// Legacy helper functions (simplified)
export async function requireAuth(request: NextRequest): Promise<{
  success: true;
  context: AuthContext;
} | {
  success: false;
  error: string;
  status: number;
}> {
  const user = await getUserFromJWT(request);
  
  if (!user) {
    return {
      success: false,
      error: 'Authentication required',
      status: 401
    };
  }

  return {
    success: true,
    context: { user }
  };
}