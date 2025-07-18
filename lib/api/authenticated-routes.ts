/**
 * Authenticated Route Decorators
 * Clean, typed wrappers that maintain route-utils simplicity while adding authentication
 */

import { withAuth, withRoles, withOrganization } from '@/lib/auth/api-middleware'
import { withRateLimit } from '@/lib/auth/rate-limiting'
import { 
  createListHandler, 
  createGetHandler, 
  createPostHandler, 
  createPutHandler, 
  createDeleteHandler 
} from '@/lib/api/route-utils'
import type { UserRole } from '@/lib/types'

// Type-safe middleware configurations
const RATE_LIMIT_CONFIGS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  public: { windowMs: 60 * 1000, maxRequests: 100 },
  heavy: { windowMs: 60 * 60 * 1000, maxRequests: 10 }
} as const

type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS

/**
 * Configuration for authenticated routes
 */
export interface AuthConfig {
  requireAuth?: boolean
  roles?: UserRole[]
  requireOrganization?: boolean
  rateLimit?: RateLimitType
}

/**
 * Authenticated list handler - maintains clean 1-line syntax
 */
export function authenticatedList<TService, TFilters>(
  service: TService,
  methodName: keyof TService,
  config: AuthConfig = {}
) {
  let handler = createListHandler<TService, TFilters>(service, methodName)

  // Apply authentication layers
  if (config.requireOrganization) {
    handler = withOrganization(handler as never)
  } else if (config.roles && config.roles.length > 0) {
    handler = withRoles(config.roles, handler as never)
  } else if (config.requireAuth) {
    handler = withAuth(handler as never)
  }

  // Apply rate limiting if configured
  if (config.rateLimit) {
    const rateLimitConfig = RATE_LIMIT_CONFIGS[config.rateLimit]
    handler = withRateLimit(rateLimitConfig)(handler as never)
  }

  return handler
}

/**
 * Authenticated GET handler for single resources
 */
export function authenticatedGet<TService>(
  service: TService,
  methodName: keyof TService,
  resourceName: string,
  config: AuthConfig = {}
) {
  let handler = createGetHandler<TService>(service, methodName, resourceName)

  if (config.requireOrganization) {
    handler = withOrganization(handler as never)
  } else if (config.roles && config.roles.length > 0) {
    handler = withRoles(config.roles, handler as never)
  } else if (config.requireAuth) {
    handler = withAuth(handler as never)
  }

  if (config.rateLimit) {
    const rateLimitConfig = RATE_LIMIT_CONFIGS[config.rateLimit]
    handler = withRateLimit(rateLimitConfig)(handler as never)
  }

  return handler
}

/**
 * Authenticated POST handler
 */
export function authenticatedPost<TService, TData>(
  service: TService,
  methodName: keyof TService,
  config: AuthConfig = {}
) {
  let handler = createPostHandler<TService, TData>(service, methodName)

  if (config.requireOrganization) {
    handler = withOrganization(handler as never)
  } else if (config.roles && config.roles.length > 0) {
    handler = withRoles(config.roles, handler as never)
  } else if (config.requireAuth) {
    handler = withAuth(handler as never)
  }

  if (config.rateLimit) {
    const rateLimitConfig = RATE_LIMIT_CONFIGS[config.rateLimit]
    handler = withRateLimit(rateLimitConfig)(handler as never)
  }

  return handler
}

/**
 * Authenticated PUT handler
 */
export function authenticatedPut<TService, TData>(
  service: TService,
  methodName: keyof TService,
  resourceName: string,
  config: AuthConfig = {}
) {
  let handler = createPutHandler<TService, TData>(service, methodName, resourceName)

  if (config.requireOrganization) {
    handler = withOrganization(handler as never)
  } else if (config.roles && config.roles.length > 0) {
    handler = withRoles(config.roles, handler as never)
  } else if (config.requireAuth) {
    handler = withAuth(handler as never)
  }

  if (config.rateLimit) {
    const rateLimitConfig = RATE_LIMIT_CONFIGS[config.rateLimit]
    handler = withRateLimit(rateLimitConfig)(handler as never)
  }

  return handler
}

/**
 * Authenticated DELETE handler
 */
export function authenticatedDelete<TService>(
  service: TService,
  methodName: keyof TService,
  resourceName: string,
  config: AuthConfig = {}
) {
  let handler = createDeleteHandler<TService>(service, methodName, resourceName)

  if (config.requireOrganization) {
    handler = withOrganization(handler as never)
  } else if (config.roles && config.roles.length > 0) {
    handler = withRoles(config.roles, handler as never)
  } else if (config.requireAuth) {
    handler = withAuth(handler as never)
  }

  if (config.rateLimit) {
    const rateLimitConfig = RATE_LIMIT_CONFIGS[config.rateLimit]
    handler = withRateLimit(rateLimitConfig)(handler as never)
  }

  return handler
}
