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
  withOrganization,
  withOptionalAuth,
  withPublic,
  type AuthContext,
  type AuthenticatedHandler,
  type AuthenticatedHandlerWithParams,
  type RoleBasedHandler
} from './api-middleware';

// Export rate limiting utilities  
export {
  withRateLimit,
  createUserRateLimit,
  createIPRateLimit,
  RateLimits
} from './rate-limiting';

// Export existing middleware functions
export {
  authenticateUser,
  getAuthContext,
  hasPermission,
  canAccessOrganization
} from './middleware';;