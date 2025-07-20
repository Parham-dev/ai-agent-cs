/**
 * Unified Route Utilities
 * Combines route-utils and authenticated-routes functionality
 */

import { NextRequest } from 'next/server';
import { withAuth, withRoles, withOrgScoping, withAuthParams } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/auth/rate-limiting';
import { ApiResponseHelper as Api, validateMethod, withErrorHandling } from '@/lib/api/helpers';
import type { UserRole, AuthContext } from '@/lib/types/auth';

// Type-safe middleware configurations
const RATE_LIMIT_CONFIGS = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  public: { windowMs: 60 * 1000, maxRequests: 100 },
  heavy: { windowMs: 60 * 60 * 1000, maxRequests: 10 }
} as const;

type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

/**
 * Simplified route configuration
 */
export interface RouteConfig {
  roles?: UserRole[];
  rateLimit?: RateLimitType;
  autoOrgScoping?: boolean; // Auto inject org context
}

/**
 * Extract common query parameters into filters object
 */
export function extractFilters(searchParams: URLSearchParams) {
  return {
    search: searchParams.get('search') || undefined,
    type: searchParams.get('type') || undefined,
    isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
  };
}

/**
 * Create a standardized GET handler for list endpoints
 */
export function createListHandler<TService, TFilters>(
  service: TService,
  methodName: keyof TService
) {
  return withErrorHandling(async (request: NextRequest) => {
    const methodError = validateMethod(request, ['GET']);
    if (methodError) return methodError;

    const { searchParams } = new URL(request.url);
    const filters = extractFilters(searchParams) as TFilters;
    
    const serviceMethod = service[methodName] as (filters: TFilters) => Promise<unknown>;
    const results = await serviceMethod.call(service, filters);
    return Api.success(results);
  });
}

/**
 * Create a standardized GET handler for single resource endpoints
 */
export function createGetHandler<TService>(
  service: TService,
  methodName: keyof TService,
  resourceName: string
) {
  return withErrorHandling(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const methodError = validateMethod(request, ['GET']);
    if (methodError) return methodError;

    const params = await context.params;
    if (!params || !params.id) {
      return Api.error('VALIDATION_ERROR', 'Missing route parameters');
    }

    const { id } = params;
    const serviceMethod = service[methodName] as (id: string) => Promise<unknown>;
    const result = await serviceMethod.call(service, id);
    
    if (!result) {
      return Api.notFound(resourceName, id);
    }
    
    return Api.success({ [resourceName.toLowerCase()]: result });
  });
}

/**
 * Create a standardized POST handler with auth context injection
 */
export function createPostHandler<TService, TData>(
  service: TService,
  methodName: keyof TService
) {
  return withErrorHandling(async (request: NextRequest, context: AuthContext) => {
    const methodError = validateMethod(request, ['POST']);
    if (methodError) return methodError;

    const data = await request.json() as TData;
    
    // Call service method with auth context - service handles organization scoping
    const serviceMethod = service[methodName] as (data: TData, authContext: AuthContext) => Promise<unknown>;
    const result = await serviceMethod.call(service, data, context);
    
    return Api.success(result, undefined, 201);
  });
}

/**
 * Create a standardized PUT handler
 */
export function createPutHandler<TService, TData>(
  service: TService,
  methodName: keyof TService,
  resourceName: string
) {
  return withErrorHandling(async (request: NextRequest, context: AuthContext, routeContext: { params: Promise<{ id: string }> }) => {
    const methodError = validateMethod(request, ['PUT']);
    if (methodError) return methodError;

    const params = await routeContext.params;
    if (!params || !params.id) {
      return Api.error('VALIDATION_ERROR', 'Missing route parameters');
    }

    const { id } = params;
    const data = await request.json() as TData;
    
    // Extract organizationId from auth context (Phase 2: Route Helper Enhancement)
    const organizationId = context.user.organizationId!;
    const serviceMethod = service[methodName] as (id: string, data: TData, organizationId: string) => Promise<unknown>;
    const result = await serviceMethod.call(service, id, data, organizationId);
    
    if (!result) {
      return Api.notFound(resourceName, id);
    }
    
    return Api.success(result);
  });
}

/**
 * Create a standardized DELETE handler
 */
export function createDeleteHandler<TService>(
  service: TService,
  methodName: keyof TService,
  resourceName: string
) {
  return withErrorHandling(async (request: NextRequest, context: AuthContext, routeContext: { params: Promise<{ id: string }> }) => {
    const methodError = validateMethod(request, ['DELETE']);
    if (methodError) return methodError;

    const params = await routeContext.params;
    if (!params || !params.id) {
      return Api.error('VALIDATION_ERROR', 'Missing route parameters');
    }

    const { id } = params;
    
    // Extract organizationId from auth context (Phase 2: Route Helper Enhancement)
    const organizationId = context.user.organizationId!;
    const serviceMethod = service[methodName] as (id: string, organizationId: string) => Promise<unknown>;
    await serviceMethod.call(service, id, organizationId);
    
    return Api.success({ message: `${resourceName} deleted successfully` });
  });
}

/**
 * Ultra-simple authenticated list handler with auto org scoping
 */
export function authenticatedList<TService, TFilters>(
  service: TService,
  methodName: keyof TService,
  config: RouteConfig = {}
) {
  // Base handler with automatic organization scoping
  const handler = withOrgScoping(withErrorHandling(async (request) => {
    const methodError = validateMethod(request, ['GET']);
    if (methodError) return methodError;

    const { searchParams } = new URL(request.url);
    const filters = extractFilters(searchParams) as TFilters;
    
    const serviceMethod = service[methodName] as (filters: TFilters) => Promise<unknown>;
    const results = await serviceMethod.call(service, filters);
    return Api.success(results);
  }));

  // Apply role restrictions if configured
  let finalHandler = handler;
  if (config.roles && config.roles.length > 0) {
    finalHandler = withRoles(config.roles, handler as never);
  }

  // Apply rate limiting if configured
  if (config.rateLimit) {
    const rateLimitConfig = RATE_LIMIT_CONFIGS[config.rateLimit];
    finalHandler = withRateLimit(rateLimitConfig)(finalHandler as never);
  }

  return finalHandler;
}

/**
 * Ultra-simple authenticated GET handler for single resources
 */
export function authenticatedGet<TService>(
  service: TService,
  methodName: keyof TService,
  resourceName: string,
  config: RouteConfig = {}
) {
  const handler = async (request: NextRequest, context: AuthContext, routeContext: { params: Promise<{ id: string }> }) => {
    const methodError = validateMethod(request, ['GET']);
    if (methodError) return methodError;

    const params = await routeContext.params;
    if (!params?.id) {
      return Api.error('VALIDATION_ERROR', 'Missing route parameters');
    }

    // Extract organizationId from auth context (Phase 2: Route Helper Enhancement)
    const organizationId = context.user.organizationId!;
    const serviceMethod = service[methodName] as (id: string, organizationId: string) => Promise<unknown>;
    const result = await serviceMethod.call(service, params.id, organizationId);
    
    if (!result) {
      return Api.notFound(resourceName, params.id);
    }
    
    return Api.success({ [resourceName.toLowerCase()]: result });
  };

  // Apply role restrictions and auth  
  let finalHandler = handler;
  if (config.roles && config.roles.length > 0) {
    finalHandler = async (request: NextRequest, context: AuthContext, routeContext: { params: Promise<{ id: string }> }) => {
      // Check roles before proceeding
      const hasPermission = config.roles!.includes(context.user.role);
      if (!hasPermission) {
        return Api.error('AUTHORIZATION_ERROR', 'Insufficient permissions');
      }
      return handler(request, context, routeContext);
    };
  }

  return withAuthParams(finalHandler);
}

/**
 * Ultra-simple authenticated POST handler
 */
export function authenticatedPost<TService, TData>(
  service: TService,
  methodName: keyof TService,
  config: RouteConfig = {}
) {
  let handler = withAuth(createPostHandler<TService, TData>(service, methodName) as never);

  // Apply role restrictions if configured
  if (config.roles && config.roles.length > 0) {
    handler = withRoles(config.roles, handler as never);
  }

  // Apply rate limiting if configured
  if (config.rateLimit) {
    const rateLimitConfig = RATE_LIMIT_CONFIGS[config.rateLimit];
    handler = withRateLimit(rateLimitConfig)(handler as never);
  }

  return handler;
}

/**
 * Ultra-simple authenticated PUT handler
 */
export function authenticatedPut<TService, TData>(
  service: TService,
  methodName: keyof TService,
  resourceName: string,
  config: RouteConfig = {}
) {
  let handler = createPutHandler<TService, TData>(service, methodName, resourceName);

  // Apply role restrictions if configured
  if (config.roles && config.roles.length > 0) {
    const originalHandler = handler;
    handler = async (request: NextRequest, context: AuthContext, routeContext: { params: Promise<{ id: string }> }) => {
      // Check roles before proceeding
      const hasPermission = config.roles!.includes(context.user.role);
      if (!hasPermission) {
        return Api.error('AUTHORIZATION_ERROR', 'Insufficient permissions');
      }
      return originalHandler(request, context, routeContext);
    };
  }

  // Apply rate limiting if configured
  if (config.rateLimit) {
    // Note: Rate limiting needs to be applied at a higher level for param-based handlers
    // const rateLimitConfig = RATE_LIMIT_CONFIGS[config.rateLimit];
  }

  return withAuthParams(handler);
}

/**
 * Ultra-simple authenticated DELETE handler
 */
export function authenticatedDelete<TService>(
  service: TService,
  methodName: keyof TService,
  resourceName: string,
  config: RouteConfig = {}
) {
  let handler = createDeleteHandler<TService>(service, methodName, resourceName);

  // Apply role restrictions if configured
  if (config.roles && config.roles.length > 0) {
    const originalHandler = handler;
    handler = async (request: NextRequest, context: AuthContext, routeContext: { params: Promise<{ id: string }> }) => {
      // Check roles before proceeding
      const hasPermission = config.roles!.includes(context.user.role);
      if (!hasPermission) {
        return Api.error('AUTHORIZATION_ERROR', 'Insufficient permissions');
      }
      return originalHandler(request, context, routeContext);
    };
  }

  // Apply rate limiting if configured
  if (config.rateLimit) {
    // Note: Rate limiting needs to be applied at a higher level for param-based handlers  
    // const rateLimitConfig = RATE_LIMIT_CONFIGS[config.rateLimit];
  }

  return withAuthParams(handler);
}