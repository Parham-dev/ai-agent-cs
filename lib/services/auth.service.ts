/**
 * Auth Service
 * Handles authentication operations with Supabase and database sync
 */

import { createClientSupabaseClient } from '@/lib/database/clients';
import type { LoginRequest, SignupRequest, ApiUser, AuthSession } from '@/lib/types';

export class AuthService {
  private supabase = createClientSupabaseClient();

  /**
   * Initialize auth state by getting current session and user data
   */
  async initializeAuth(): Promise<{
    user: ApiUser | null;
    session: AuthSession | null;
    error?: string;
  }> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        return { user: null, session: null, error: error.message };
      }

      if (!session) {
        return { user: null, session: null };
      }

      const userData = await this.fetchUserData(session.access_token);
      if (!userData) {
        // Invalid session, sign out
        await this.supabase.auth.signOut();
        return { user: null, session: null };
      }

      return {
        user: userData,
        session: this.formatSession(session)
      };
    } catch {
      return {
        user: null,
        session: null,
        error: 'Authentication initialization failed'
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async login(credentials: LoginRequest): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user || !authData.session) {
        return { success: false, error: 'Login failed - no user data received' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * Create new account with organization setup
   */
  async signup(credentials: SignupRequest): Promise<{
    success: boolean;
    error?: string;
    message?: string;
    user?: ApiUser;
    session?: AuthSession;
  }> {
    try {
      // Step 1: Prepare organization
      const setupResponse = await fetch('/api/v2/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const setupData = await setupResponse.json();
      if (!setupResponse.ok) {
        return { success: false, error: setupData.error?.message || 'Signup preparation failed' };
      }

      // Step 2: Create Supabase auth user
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: { name: credentials.name || credentials.email.split('@')[0] }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Step 3: Sync user to database (if session exists)
      if (authData.session) {
        const syncResult = await this.syncUserToDatabase({
          supabaseUserId: authData.user.id,
          email: authData.user.email || credentials.email,
          name: credentials.name || authData.user.user_metadata?.name,
          organizationId: setupData.data.organizationId,
          accessToken: authData.session.access_token
        });

        if (!syncResult.success) {
          return { success: false, error: syncResult.error };
        }

        // Step 4: Get final user data
        const userData = await this.fetchUserData(authData.session.access_token);
        if (!userData) {
          return { success: false, error: 'Failed to fetch user data after signup' };
        }

        return {
          success: true,
          message: 'Account created successfully!',
          user: userData,
          session: this.formatSession(authData.session)
        };
      }

      return {
        success: true,
        message: 'Account created! Please check your email to confirm your account.'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed'
      };
    }
  }

  /**
   * Sign out user
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }

  /**
   * Get auth state change subscription
   */
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Get current session
   */
  async getCurrentSession() {
    return this.supabase.auth.getSession();
  }

  // Private helper methods

  private async fetchUserData(accessToken: string): Promise<ApiUser | null> {
    try {
      const response = await fetch('/api/v2/auth/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.data;
    } catch {
      return null;
    }
  }

  private async syncUserToDatabase(data: {
    supabaseUserId: string;
    email: string;
    name?: string;
    organizationId: string;
    accessToken: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/v2/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error?.message || 'Failed to sync user' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync user'
      };
    }
  }

  private formatSession(session: {
    user: { id: string; email?: string; user_metadata?: { name?: string } };
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  }): AuthSession {
    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name
      },
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at || 0
    };
  }
}

// Export singleton instance
export const authService = new AuthService();
