/**
 * Unified Route Utilities
 * Combines route-utils and authenticated-routes functionality
 */

import { NextRequest } from 'next/server';
import { withAuth, withRoles, withOrgScoping, withAuthParams } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/auth/rate-limiting';
import { ApiResponseHelper as Api, validateMethod, withErrorHandling } from '@/lib/api/helpers';
import type { UserRole } from '@/lib/types/auth';

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
    organizationId: searchParams.get('organizationId') || undefined,
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
 * Create a standardized POST handler
 */
export function createPostHandler<TService, TData>(
  service: TService,
  methodName: keyof TService
) {
  return withErrorHandling(async (request: NextRequest) => {
    const methodError = validateMethod(request, ['POST']);
    if (methodError) return methodError;

    const data = await request.json() as TData;
    const serviceMethod = service[methodName] as (data: TData) => Promise<unknown>;
    const result = await serviceMethod.call(service, data);
    
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
  return withErrorHandling(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const methodError = validateMethod(request, ['PUT']);
    if (methodError) return methodError;

    const params = await context.params;
    if (!params || !params.id) {
      return Api.error('VALIDATION_ERROR', 'Missing route parameters');
    }

    const { id } = params;
    const data = await request.json() as TData;
    const serviceMethod = service[methodName] as (id: string, data: TData) => Promise<unknown>;
    const result = await serviceMethod.call(service, id, data);
    
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
  return withErrorHandling(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const methodError = validateMethod(request, ['DELETE']);
    if (methodError) return methodError;

    const params = await context.params;
    if (!params || !params.id) {
      return Api.error('VALIDATION_ERROR', 'Missing route parameters');
    }

    const { id } = params;
    const serviceMethod = service[methodName] as (id: string) => Promise<unknown>;
    await serviceMethod.call(service, id);
    
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
  const handler = async (request: NextRequest, context: unknown, routeContext: { params: Promise<{ id: string }> }) => {
    const methodError = validateMethod(request, ['GET']);
    if (methodError) return methodError;

    const params = await routeContext.params;
    if (!params?.id) {
      return Api.error('VALIDATION_ERROR', 'Missing route parameters');
    }

    const serviceMethod = service[methodName] as (id: string) => Promise<unknown>;
    const result = await serviceMethod.call(service, params.id);
    
    if (!result) {
      return Api.notFound(resourceName, params.id);
    }
    
    return Api.success({ [resourceName.toLowerCase()]: result });
  };

  // Apply role restrictions if configured  
  let finalHandler = handler;
  if (config.roles && config.roles.length > 0) {
    finalHandler = async (request: NextRequest, context: unknown, routeContext: { params: Promise<{ id: string }> }) => {
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
  let handler = withAuth(createPutHandler<TService, TData>(service, methodName, resourceName) as never);

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
 * Ultra-simple authenticated DELETE handler
 */
export function authenticatedDelete<TService>(
  service: TService,
  methodName: keyof TService,
  resourceName: string,
  config: RouteConfig = {}
) {
  let handler = withAuth(createDeleteHandler<TService>(service, methodName, resourceName) as never);

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