/**
 * API Route Utilities - Reduce boilerplate in route handlers
 */

import { NextRequest } from 'next/server'
import { ApiResponseHelper as Api, validateMethod } from '@/lib/api/helpers'
import { withErrorHandling } from '@/lib/api/error-handling'

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
  }
}

/**
 * Create a standardized GET handler for list endpoints
 */
export function createListHandler<TService, TFilters>(
  service: TService,
  methodName: keyof TService
) {
  return withErrorHandling(async (request: NextRequest) => {
    const methodError = validateMethod(request, ['GET'])
    if (methodError) return methodError

    const { searchParams } = new URL(request.url)
    const filters = extractFilters(searchParams) as TFilters
    
    const serviceMethod = service[methodName] as (filters: TFilters) => Promise<unknown>
    const results = await serviceMethod.call(service, filters)
    return Api.success(results)
  })
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
    const methodError = validateMethod(request, ['GET'])
    if (methodError) return methodError

    const { id } = await context.params
    const serviceMethod = service[methodName] as (id: string) => Promise<unknown>
    const result = await serviceMethod.call(service, id)
    
    if (!result) {
      return Api.notFound(resourceName, id)
    }
    
    return Api.success({ [resourceName.toLowerCase()]: result })
  })
}

/**
 * Create a standardized POST handler
 */
export function createPostHandler<TService, TData>(
  service: TService,
  methodName: keyof TService
) {
  return withErrorHandling(async (request: NextRequest) => {
    const methodError = validateMethod(request, ['POST'])
    if (methodError) return methodError

    const data = await request.json() as TData
    const serviceMethod = service[methodName] as (data: TData) => Promise<unknown>
    const result = await serviceMethod.call(service, data)
    
    return Api.success(result, undefined, 201)
  })
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
    const methodError = validateMethod(request, ['PUT'])
    if (methodError) return methodError

    const { id } = await context.params
    const data = await request.json() as TData
    const serviceMethod = service[methodName] as (id: string, data: TData) => Promise<unknown>
    const result = await serviceMethod.call(service, id, data)
    
    if (!result) {
      return Api.notFound(resourceName, id)
    }
    
    return Api.success(result)
  })
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
    const methodError = validateMethod(request, ['DELETE'])
    if (methodError) return methodError

    const { id } = await context.params
    const serviceMethod = service[methodName] as (id: string) => Promise<unknown>
    await serviceMethod.call(service, id)
    
    return Api.success({ message: `${resourceName} deleted successfully` })
  })
}
