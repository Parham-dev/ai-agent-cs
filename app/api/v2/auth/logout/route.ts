import { NextRequest, NextResponse } from 'next/server';
import { createClientSupabaseClient } from '@/lib/database/clients';
import { Api, validateMethod } from '@/lib/api';

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  try {
    // Create Supabase client
    const supabase = createClientSupabaseClient();

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return Api.error(
        'AUTHENTICATION_ERROR',
        'Failed to logout',
        error.message
      );
    }

    return Api.success(
      { message: 'Logout successful' },
      { message: 'Successfully logged out' }
    );

  } catch (error) {
    console.error('Logout error:', error);
    return Api.internalError('Logout failed');
  }
}