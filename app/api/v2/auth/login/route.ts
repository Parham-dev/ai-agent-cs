import { NextRequest, NextResponse } from 'next/server';
import { createClientSupabaseClient } from '@/lib/database/clients';
import { usersService } from '@/lib/database/services';
import { Api, validateRequest, validateMethod } from '@/lib/api';
import { z } from 'zod';
import type { LoginRequest, AuthResponse } from '@/lib/types';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  try {
    // Validate request body
    const validation = await validateRequest(request, loginSchema);
    if (validation.error) return validation.error;
    
    const { email, password }: LoginRequest = validation.data;

    // Create Supabase client
    const supabase = createClientSupabaseClient();

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return Api.error(
        'AUTHENTICATION_ERROR',
        'Invalid email or password',
        authError.message
      );
    }

    if (!authData.user || !authData.session) {
      return Api.error(
        'AUTHENTICATION_ERROR',
        'Authentication failed'
      );
    }

    // Sync user with our database
    let user;
    try {
      user = await usersService.syncUserFromSupabase(authData.user);
    } catch (error) {
      console.error('Failed to sync user:', error);
      return Api.error(
        'DATABASE_ERROR',
        'Failed to sync user data'
      );
    }

    // Prepare response
    const response: AuthResponse = {
      user: {
        id: user.id,
        supabaseId: user.supabaseId,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      },
      session: {
        user: {
          id: authData.user.id,
          email: authData.user.email || '',
          name: authData.user.user_metadata?.name
        },
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresAt: authData.session.expires_at || 0
      }
    };

    return Api.success(response, {
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return Api.internalError('Login failed');
  }
}