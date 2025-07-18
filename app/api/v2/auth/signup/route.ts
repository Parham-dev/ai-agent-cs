import { NextRequest, NextResponse } from 'next/server';
import { createClientSupabaseClient } from '@/lib/database/clients';
import { usersService } from '@/lib/database/services';
import { Api, validateRequest, validateMethod } from '@/lib/api';
import { z } from 'zod';
import type { SignupRequest, AuthResponse } from '@/lib/types';

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
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

    // Create Supabase client
    const supabase = createClientSupabaseClient();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0] // Fallback to email prefix
        }
      }
    });

    if (authError) {
      return Api.error(
        'AUTHENTICATION_ERROR',
        'Failed to create account',
        authError.message
      );
    }

    if (!authData.user) {
      return Api.error(
        'AUTHENTICATION_ERROR',
        'Failed to create user account'
      );
    }

    // Create user in our database
    let user;
    try {
      user = await usersService.createUser({
        supabaseId: authData.user.id,
        email: authData.user.email || email,
        name: name || authData.user.user_metadata?.name,
        role: 'USER' // Default role
      });
    } catch (error) {
      console.error('Failed to create user in database:', error);
      
      // If database creation fails, we should clean up the Supabase user
      // In production, you might want to handle this differently
      return Api.error(
        'DATABASE_ERROR',
        'Failed to complete user registration'
      );
    }

    // If there's a session (auto-login after signup)
    let response: AuthResponse;
    if (authData.session) {
      response = {
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
    } else {
      // Email confirmation required
      response = {
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
          accessToken: '',
          refreshToken: '',
          expiresAt: 0
        }
      };
    }

    return Api.success(response, {
      message: authData.session 
        ? 'Account created successfully' 
        : 'Account created. Please check your email to confirm your account.'
    });

  } catch (error) {
    console.error('Signup error:', error);
    return Api.internalError('Registration failed');
  }
}