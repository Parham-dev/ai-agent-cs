import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/database/clients';
import { usersService } from '@/lib/database/services';
import { Api, validateRequest, validateMethod } from '@/lib/api';
import { withRateLimit, RateLimits } from '@/lib/auth/rate-limiting';
import { syncUserJWTMetadata } from '@/lib/services/jwt-metadata.service';
import { z } from 'zod';

const syncUserSchema = z.object({
  supabaseUserId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  organizationId: z.string(),
  accessToken: z.string()
});

// Apply rate limiting to sync-user endpoint
const rateLimitedHandler = withRateLimit(RateLimits.auth);

export const POST = rateLimitedHandler(async function(request: NextRequest): Promise<NextResponse> {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  try {
    // Validate request body
    const validation = await validateRequest(request, syncUserSchema);
    if (validation.error) return validation.error;
    
    const { supabaseUserId, email, name, organizationId, accessToken } = validation.data;

    // Verify the access token with Supabase
    const supabase = createServerSupabaseClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !supabaseUser || supabaseUser.id !== supabaseUserId) {
      return Api.error(
        'AUTHENTICATION_ERROR',
        'Invalid or expired token'
      );
    }

    // Check if user already exists
    let user = await usersService.getUserBySupabaseId(supabaseUserId);
    
    if (!user) {
      // Create new user
      user = await usersService.createUser({
        supabaseId: supabaseUserId,
        email: email,
        name: name || supabaseUser.user_metadata?.name,
        role: 'ADMIN', // Make them admin of their organization
        organizationId: organizationId
      });
    }

    // Sync JWT metadata with the user data
    try {
      await syncUserJWTMetadata(supabaseUserId, user);
    } catch (error) {
      console.error('Failed to sync JWT metadata:', error);
      return Api.error(
        'INTERNAL_ERROR',
        'User created but failed to set JWT metadata'
      );
    }

    // Return user data
    return Api.success({
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
      }
    }, {
      message: 'User synced successfully'
    });

  } catch (error) {
    console.error('Sync user error:', error);
    return Api.internalError('Failed to sync user');
  }
});