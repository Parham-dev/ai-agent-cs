/**
 * API Error Handling with Smart Error Detection
 */

import { NextResponse } from 'next/server'
import { ApiResponseHelper as Api } from '@/lib/api/helpers'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'

/**
 * Smart error handler with automatic error type detection and appropriate responses
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<NextResponse | R> => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('API Error:', error)
      
      // Handle custom application errors
      if (error instanceof NotFoundError) {
        return Api.error('NOT_FOUND', error.message)
      }
      
      if (error instanceof ValidationError) {
        return Api.error('VALIDATION_ERROR', error.message)
      }
      
      if (error instanceof DatabaseError) {
        return Api.error('DATABASE_ERROR', 'Database operation failed', {
          operation: error.cause?.message || 'unknown'
        })
      }
      
      // Handle Prisma specific errors
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; meta?: { target?: string[] } }
        
        switch (prismaError.code) {
          case 'P2002':
            return Api.error('CONFLICT', 'Resource already exists', {
              field: prismaError.meta?.target
            })
          case 'P2025':
            return Api.error('NOT_FOUND', 'Resource not found')
          case 'P2003':
            return Api.error('VALIDATION_ERROR', 'Foreign key constraint failed')
          default:
            return Api.error('DATABASE_ERROR', 'Database operation failed')
        }
      }
      
      // Handle validation errors (from Zod or similar)
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ path: string[]; message: string }> }
        const validationErrors = zodError.issues.reduce((acc: Record<string, string>, issue) => {
          const path = issue.path.join('.')
          acc[path] = issue.message
          return acc
        }, {})
        
        return Api.validationError(validationErrors)
      }
      
      // Handle network/external API errors
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          return Api.error('EXTERNAL_API_ERROR', 'External service unavailable')
        }
        
        if (error.message.includes('timeout')) {
          return Api.error('EXTERNAL_API_ERROR', 'Request timeout')
        }
      }
      
      // Generic internal error
      return Api.internalError()
    }
  }
}
