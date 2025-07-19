import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/database/clients';
import { usersService } from '@/lib/database/services';
import { Api, validateRequest, validateMethod } from '@/lib/api';
import { withRateLimit, RateLimits } from '@/lib/auth/rate-limiting';
import { syncUserJWTMetadata } from '@/lib/services/jwt-metadata.service';
import { z } from 'zod';
import type { LoginRequest } from '@/lib/types/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Apply rate limiting to login endpoint
const rateLimitedHandler = withRateLimit(RateLimits.auth);

export const POST = rateLimitedHandler(async function(request: NextRequest): Promise<NextResponse> {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  try {
    // Validate request body
    const validation = await validateRequest(request, loginSchema);
    if (validation.error) return validation.error;
    
    const { email, password }: LoginRequest = validation.data;

    // Create Supabase client for server-side auth operations
    const supabase = createServerSupabaseClient();

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

    // Get or sync user with our database
    let user;
    try {
      user = await usersService.getUserBySupabaseId(authData.user.id);
      
      if (!user) {
        // User exists in Supabase but not in our database
        // This shouldn't happen with the new flow, but handle it gracefully
        return Api.error(
          'NOT_FOUND',
          'User account not found. Please contact support.'
        );
      }
    } catch (error) {
      console.error('Failed to get user:', error);
      return Api.error(
        'DATABASE_ERROR',
        'Failed to retrieve user data'
      );
    }

    // Sync JWT metadata with latest user data
    try {
      await syncUserJWTMetadata(authData.user.id, user);
    } catch (error) {
      console.error('Failed to sync JWT metadata:', error);
      // Don't fail login for metadata sync errors
    }

    // Return simplified user data (no need for session object)
    return Api.success({
      user,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return Api.internalError('Login failed');
  }
});