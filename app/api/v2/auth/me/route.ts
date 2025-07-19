import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { Api } from '@/lib/api';
// No need for User import - using it directly from context

export const GET = withAuth(async function(request: NextRequest, { user }): Promise<NextResponse> {
  try {
    // Return user data directly from JWT context (no DB lookup needed!)
    return Api.success(user, {
      message: 'User retrieved successfully'
    });

  } catch (error) {
    console.error('Get user error:', error);
    return Api.internalError('Failed to get user information');
  }
});