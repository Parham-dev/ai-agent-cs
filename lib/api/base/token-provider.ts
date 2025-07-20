/**
 * Token Provider - manages auth token retrieval for API clients
 */

import { createClientSupabaseClient } from '@/lib/database/clients';

/**
 * Global token provider instance
 */
class TokenProvider {
  private supabase = createClientSupabaseClient();
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Get current auth token with caching
   */
  async getToken(): Promise<string | null> {
    try {
      // Check if we have a cached token that's still valid
      if (this.cachedToken && Date.now() < this.tokenExpiry) {
        return this.cachedToken;
      }

      // Get fresh token from Supabase
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        this.cachedToken = null;
        this.tokenExpiry = 0;
        return null;
      }

      // Cache the token with 5 minute buffer before expiry
      this.cachedToken = session.access_token;
      this.tokenExpiry = (session.expires_at || 0) * 1000 - 5 * 60 * 1000; // 5 min buffer

      return this.cachedToken;
    } catch (error) {
      console.error('TokenProvider: Failed to get auth token:', error);
      this.cachedToken = null;
      this.tokenExpiry = 0;
      return null;
    }
  }

  /**
   * Clear cached token (call on logout)
   */
  clearToken(): void {
    this.cachedToken = null;
    this.tokenExpiry = 0;
  }

  /**
   * Set token manually (useful for testing or SSR)
   */
  setToken(token: string, expiresAt?: number): void {
    this.cachedToken = token;
    this.tokenExpiry = expiresAt || Date.now() + 60 * 60 * 1000; // 1 hour default
  }
}

export const tokenProvider = new TokenProvider();
