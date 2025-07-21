import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { Api } from '@/lib/api';

export const POST = withAuth(async function(): Promise<NextResponse> {
  try {
    // At this point, the user is authenticated (verified by withAuth middleware)
    // The client-side will handle the actual sign-out process
    // This endpoint just confirms the logout action server-side
    
    return Api.success(
      { 
        success: true,
        message: 'Logout successful' 
      },
      { 
        message: 'Successfully logged out',
        timestamp: new Date().toISOString()
      }
    );

  } catch (error) {
    console.error('Logout error:', error);
    return Api.internalError('Logout failed');
  }
});