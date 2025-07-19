/**
 * Auth Module - Centralized exports
 */

/**
 * Authentication Library
 * Centralized authentication utilities and middleware
 */

// Export authentication middleware
export {
  withAuth,
  withAuthParams,
  withRoles,
  withOrgScoping,
  withOptionalAuth,
  updateUserJWTMetadata,
  requireAuth
} from './middleware';

// Export types
export type { AuthContext } from '@/lib/types/auth';

// Export rate limiting utilities  
export {
  withRateLimit,
  createUserRateLimit,
  createIPRateLimit,
  RateLimits
} from './rate-limiting';

// Export auth utilities
export {
  hasPermission,
  canAccessOrganization
} from '@/lib/types/auth';