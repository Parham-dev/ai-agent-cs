/**
 * JWT Metadata Service
 * Manages organization and role data in Supabase JWT metadata
 */

import { createServerSupabaseClient } from '@/lib/database/clients';
import { usersService } from '@/lib/database/services';
import type { User, JWTMetadata } from '@/lib/types/auth';

/**
 * Update JWT metadata with user's org and role
 * Call this whenever user org/role changes
 */
export async function updateUserJWTMetadata(supabaseUserId: string): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get current user data from database
    const user = await usersService.getUserBySupabaseId(supabaseUserId);
    
    if (!user) {
      throw new Error(`User not found for Supabase ID: ${supabaseUserId}`);
    }

    // Build metadata object
    const metadata: JWTMetadata = {
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };

    // Update Supabase user metadata
    const { error } = await supabase.auth.admin.updateUserById(supabaseUserId, {
      app_metadata: metadata
    });

    if (error) {
      throw new Error(`Failed to update JWT metadata: ${error.message}`);
    }

    console.log(`Updated JWT metadata for user ${user.id}:`, metadata);
  } catch (error) {
    console.error('Error updating JWT metadata:', error);
    throw error;
  }
}

/**
 * Sync JWT metadata for user during login/signup
 */
export async function syncUserJWTMetadata(supabaseUserId: string, userData: Partial<User>): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();

    const metadata: JWTMetadata = {
      userId: userData.id!,
      organizationId: userData.organizationId || null,
      role: userData.role || 'USER',
    };

    const { error } = await supabase.auth.admin.updateUserById(supabaseUserId, {
      app_metadata: metadata
    });

    if (error) {
      throw new Error(`Failed to sync JWT metadata: ${error.message}`);
    }

    console.log(`Synced JWT metadata for user ${userData.id}:`, metadata);
  } catch (error) {
    console.error('Error syncing JWT metadata:', error);
    throw error;
  }
}

/**
 * Clear JWT metadata (e.g., when user is deactivated)
 */
export async function clearUserJWTMetadata(supabaseUserId: string): Promise<void> {
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase.auth.admin.updateUserById(supabaseUserId, {
      app_metadata: {}
    });

    if (error) {
      throw new Error(`Failed to clear JWT metadata: ${error.message}`);
    }

    console.log(`Cleared JWT metadata for user ${supabaseUserId}`);
  } catch (error) {
    console.error('Error clearing JWT metadata:', error);
    throw error;
  }
}