import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { Api } from '@/lib/api';
import { usersService } from '@/lib/database/services';
import { syncUserJWTMetadata } from '@/lib/services/jwt-metadata.service';

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

export const PATCH = withAuth(async function(request: NextRequest, { user }): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { name } = body;

    // Validate input
    if (typeof name !== 'string') {
      return Api.error('VALIDATION_ERROR', 'Name must be a string');
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return Api.error('VALIDATION_ERROR', 'Name is required');
    }

    if (trimmedName.length < 2) {
      return Api.error('VALIDATION_ERROR', 'Name must be at least 2 characters');
    }

    if (trimmedName.length > 50) {
      return Api.error('VALIDATION_ERROR', 'Name must be less than 50 characters');
    }

    // Update user in database
    const updatedUser = await usersService.updateUser(user.id, {
      name: trimmedName
    });

    if (!updatedUser) {
      return Api.notFound('User', user.id);
    }

    // Sync updated user data to JWT metadata
    await syncUserJWTMetadata(updatedUser.supabaseId, updatedUser);

    return Api.success(updatedUser, {
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    return Api.internalError('Failed to update profile');
  }
});