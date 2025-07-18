import { NextRequest, NextResponse } from 'next/server';
import { createClientSupabaseClient } from '@/lib/database/clients';
import { usersService } from '@/lib/database/services';
import { Api, validateMethod } from '@/lib/api';
import type { ApiUser } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Validate HTTP method
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Api.error(
        'AUTHENTICATION_ERROR',
        'Missing or invalid authorization header'
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client
    const supabase = createClientSupabaseClient();

    // Get user from token
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !supabaseUser) {
      return Api.error(
        'AUTHENTICATION_ERROR',
        'Invalid or expired token'
      );
    }

    // Get user from our database
    const user = await usersService.getUserBySupabaseId(supabaseUser.id);
    if (!user) {
      return Api.error(
        'NOT_FOUND',
        'User not found in database'
      );
    }

    if (!user.isActive) {
      return Api.error(
        'AUTHENTICATION_ERROR',
        'User account is deactivated'
      );
    }

    // Return user data
    const apiUser: ApiUser = {
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

    return Api.success(apiUser, {
      message: 'User retrieved successfully'
    });

  } catch (error) {
    console.error('Get user error:', error);
    return Api.internalError('Failed to get user information');
  }
}