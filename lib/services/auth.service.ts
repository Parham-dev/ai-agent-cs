/**
 * Auth Service
 * Handles authentication operations with Supabase and database sync
 */

import { createClientSupabaseClient } from '@/lib/database/clients';
import { tokenProvider } from '@/lib/api/base/token-provider';
import type { Session } from '@supabase/supabase-js';
import type { LoginRequest, SignupRequest, User, AuthSession } from '@/lib/types/auth';

export class AuthService {
  private supabase = createClientSupabaseClient();

  /**
   * Initialize auth state by getting current session and user data
   */
  async initializeAuth(): Promise<{
    user: User | null;
    session: AuthSession | null;
    error?: string;
  }> {
    try {
      // Use TokenProvider as single source of truth
      const accessToken = await tokenProvider.getToken();
      
      if (!accessToken) {
        return { user: null, session: null };
      }

      // Get session info from Supabase
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error || !session) {
        tokenProvider.clearToken();
        return { user: null, session: null };
      }

      const userData = await this.fetchUserData(accessToken);
      if (!userData) {
        // Invalid token/session, clear everything
        tokenProvider.clearToken();
        await this.supabase.auth.signOut();
        return { user: null, session: null };
      }

      return {
        user: userData,
        session: this.convertSupabaseSession(session)
      };
    } catch {
      tokenProvider.clearToken();
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
    user?: User;
    session?: AuthSession;
  }> {
    try {
      // Single signup call - the API endpoint handles everything
      const signupResponse = await fetch('/api/v2/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const signupData = await signupResponse.json();
      if (!signupResponse.ok) {
        return { success: false, error: signupData.error?.message || 'Signup failed' };
      }

      // Now sign in to get the session
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.session) {
        return { success: false, error: 'Failed to create session after signup' };
      }

      // Wait a moment for JWT metadata to propagate, then refresh the session
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the session to get updated JWT with metadata
      const { data: refreshData, error: refreshError } = await this.supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        console.warn('Failed to refresh session after signup, using original session');
      }
      
      const finalSession = refreshData?.session || authData.session;

      // Get user data using the refreshed session
      const userData = await this.fetchUserData(finalSession.access_token);
      if (!userData) {
        return { success: false, error: 'Failed to fetch user data after signup' };
      }

      return {
        success: true,
        message: 'Account created successfully!',
        user: userData,
        session: this.convertSupabaseSession(finalSession)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed'
      };
    }
  }

  /**
   * Sign out user with complete session cleanup
   */
  async logout(): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      // Clear TokenProvider cache first
      tokenProvider.clearToken();
      
      // Sign out from Supabase (this clears localStorage session)
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout error:', error);
        // Don't fail logout if Supabase signOut fails - session might already be expired
      }

      // Call server-side logout confirmation (optional)
      try {
        const token = await tokenProvider.getToken();
        if (token) {
          await fetch('/api/v2/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      } catch {
        // Ignore server-side logout errors
      }
      
      return { 
        success: true,
        message: 'Successfully logged out'
      };
    } catch (error) {
      // Even if logout partially fails, clear local state
      tokenProvider.clearToken();
      
      return {
        success: true, // Always return success to clear UI state
        error: error instanceof Error ? error.message : 'Logout completed with warnings',
        message: 'Logged out successfully'
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

  private convertSupabaseSession(supabaseSession: Session): AuthSession {
    return {
      accessToken: supabaseSession.access_token,
      refreshToken: supabaseSession.refresh_token,
      expiresAt: supabaseSession.expires_at ? supabaseSession.expires_at * 1000 : 0
    };
  }

  private async fetchUserData(accessToken: string): Promise<User | null> {
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

}

// Export singleton instance
export const authService = new AuthService();
