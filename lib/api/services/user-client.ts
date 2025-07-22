/**
 * User API Client
 * Handles user profile and authentication-related operations
 */

import { BaseApiClient } from '../base/client';
import type { User } from '@/lib/types/auth';

export class UserApiClient extends BaseApiClient {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return this.request('/auth/me');
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: { name: string }): Promise<User> {
    return this.request('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}
