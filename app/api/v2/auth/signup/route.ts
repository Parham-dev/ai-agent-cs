import { NextRequest, NextResponse } from 'next/server';
import { usersService } from '@/lib/database/services';
import { Api, validateRequest, validateMethod } from '@/lib/api';
import { withRateLimit, RateLimits } from '@/lib/auth/rate-limiting';
import { createServerSupabaseClient } from '@/lib/database/clients';
import { prisma } from '@/lib/database';
import { syncUserJWTMetadata } from '@/lib/services/jwt-metadata.service';
import { organizationCreditsService } from '@/lib/database/services/organization-credits.service';
import { z } from 'zod';
import type { SignupRequest } from '@/lib/types/auth';

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters')
});

// Apply rate limiting to signup endpoint
const rateLimitedHandler = withRateLimit(RateLimits.auth);

export const POST = rateLimitedHandler(async function(request: NextRequest): Promise<NextResponse> {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  try {
    // Validate request body
    const validation = await validateRequest(request, signupSchema);
    if (validation.error) return validation.error;
    
    const { email, password, name }: SignupRequest = validation.data;

    // Check if user already exists in our database
    const existingUser = await usersService.getUserByEmail(email);
    if (existingUser) {
      return Api.error(
        'VALIDATION_ERROR',
        'User with this email already exists'
      );
    }

    // Use database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Generate a unique slug for the organization
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueSlug = `${emailPrefix}-${timestamp}-${randomString}`;
      
      // Create organization first
      const organizationName = `${name}'s Organization`;
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: uniqueSlug,
          description: 'Default organization'
        }
      });

      // Create Supabase user using regular signup (not admin)
      const supabase = createServerSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: undefined // Skip email confirmation in development
        }
      });

      if (authError || !authData.user) {
        throw new Error(`Supabase user creation failed: ${authError?.message || 'Unknown error'}`);
      }

      // Create user in our database  
      const user = await tx.user.create({
        data: {
          supabaseId: authData.user.id,
          email,
          name,
          organizationId: organization.id,
          role: 'ADMIN', // First user in organization is admin
          isActive: true
        }
      });

      return {
        user,
        organization,
        supabaseUser: authData.user
      };
    });

    // Initialize organization credits with free credits
    try {
      await organizationCreditsService.initializeOrganizationCredits(result.organization.id);
      console.log('Initialized organization credits for:', result.organization.id);
    } catch (error) {
      console.error('Failed to initialize organization credits during signup:', error);
      // Don't fail the signup, but log the error
    }

    // Sync JWT metadata with the user data
    try {
      await syncUserJWTMetadata(result.supabaseUser.id, result.user);
    } catch (error) {
      console.error('Failed to sync JWT metadata during signup:', error);
      // Don't fail the signup, but log the error
    }

    return Api.success({
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        organizationId: result.user.organizationId
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug
      }
    }, {
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Supabase')) {
        return Api.error(
          'AUTHENTICATION_ERROR',
          'Failed to create authentication account'
        );
      }
      if (error.message.includes('Unique constraint')) {
        return Api.error(
          'VALIDATION_ERROR',
          'User with this email already exists'
        );
      }
    }

    return Api.internalError('Registration failed');
  }
});