import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-middleware';
import { Api } from '@/lib/api';
import type { ApiUser } from '@/lib/types';

export const GET = withAuth(async function(request: NextRequest, { user }): Promise<NextResponse> {
  try {
    // Return user data directly from auth context
    const apiUser: ApiUser = {
      id: user.id,
      supabaseId: user.supabaseId,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return Api.success(apiUser, {
      message: 'User retrieved successfully'
    });

  } catch (error) {
    console.error('Get user error:', error);
    return Api.internalError('Failed to get user information');
  }
});