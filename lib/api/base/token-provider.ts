/**
 * Token Provider - manages auth token retrieval with cross-tab synchronization
 */

import { createClientSupabaseClient } from '@/lib/database/clients';

/**
 * Cross-tab synchronized token provider
 */
class TokenProvider {
  private supabase = createClientSupabaseClient();
  private authChangeListeners: Set<() => void> = new Set();

  constructor() {
    // Listen for storage changes from other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // Listen for Supabase auth state changes in this tab
      this.supabase.auth.onAuthStateChange((event) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          this.notifyAuthChange();
        }
      });
    }
  }

  /**
   * Get current auth token directly from Supabase (no caching)
   */
  async getToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        return null;
      }

      // Validate token isn't expired (with 1 minute buffer)
      const expiresAt = (session.expires_at || 0) * 1000;
      if (expiresAt <= Date.now() + 60 * 1000) {
        return null;
      }

      return session.access_token;
    } catch (error) {
      console.error('TokenProvider: Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Clear token (triggers logout)
   */
  clearToken(): void {
    // Supabase handles localStorage clearing
    this.supabase.auth.signOut();
  }

  /**
   * Handle storage changes from other tabs
   */
  private handleStorageChange(event: StorageEvent): void {
    // Check if Supabase session storage was modified
    if (event.key?.startsWith('sb-') && event.key.includes('-auth-token')) {
      this.notifyAuthChange();
    }
  }

  /**
   * Notify listeners of auth changes
   */
  private notifyAuthChange(): void {
    this.authChangeListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('TokenProvider: Error in auth change listener:', error);
      }
    });
  }

  /**
   * Subscribe to auth changes across tabs
   */
  onAuthChange(callback: () => void): () => void {
    this.authChangeListeners.add(callback);
    
    return () => {
      this.authChangeListeners.delete(callback);
    };
  }

  /**
   * Set token manually (for testing - not recommended)
   * @deprecated Use Supabase auth methods instead
   */
  setToken(): void {
    console.warn('TokenProvider.setToken() is deprecated. Use Supabase auth methods instead.');
  }
}

export const tokenProvider = new TokenProvider();
