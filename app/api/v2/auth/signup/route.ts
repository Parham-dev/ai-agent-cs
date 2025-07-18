import { NextRequest, NextResponse } from 'next/server';
import { usersService, organizationsService } from '@/lib/database/services';
import { Api, validateRequest, validateMethod } from '@/lib/api';
import { z } from 'zod';
import type { SignupRequest } from '@/lib/types';

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
    
    const { email, name }: SignupRequest = validation.data;

    // Check if user already exists in our database
    const existingUser = await usersService.getUserByEmail(email);
    if (existingUser) {
      return Api.error(
        'VALIDATION_ERROR',
        'User with this email already exists'
      );
    }

    // For local development, we'll use a simpler approach
    // Create the user record first, then handle auth on the client side
    
    // Generate a unique slug for the organization
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8); // 6 random chars
    const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''); // Clean email prefix
    const uniqueSlug = `${emailPrefix}-${timestamp}-${randomString}`;
    
    try {
      // Create a default organization for the user
      const organizationName = name ? `${name}'s Organization` : `${email.split('@')[0]}'s Organization`;
      const organization = await organizationsService.createOrganization({
        name: organizationName,
        slug: uniqueSlug,
        description: 'Default organization'
      });

      // Return success - the client will handle Supabase auth and then sync the user
      return Api.success({
        message: 'Ready to create account',
        email,
        name,
        organizationId: organization.id,
        organizationName: organization.name
      }, {
        message: 'Account setup prepared successfully'
      });

    } catch (error) {
      console.error('Failed to prepare user setup:', error);
      return Api.error(
        'DATABASE_ERROR',
        'Failed to prepare user registration'
      );
    }

  } catch (error) {
    console.error('Signup error:', error);
    return Api.internalError('Registration failed');
  }
}