/**
 * Rate Limiting Utilities
 * Provides rate limiting for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (consider Redis for production)
const rateLimitStore: RateLimitStore = {};

/**
 * Clean expired entries from rate limit store
 */
function cleanExpiredEntries() {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}

/**
 * Generate default rate limit key from request
 */
function getDefaultKey(request: NextRequest): string {
  // Use IP address and endpoint
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown';
  const endpoint = new URL(request.url).pathname;
  return `${ip}:${endpoint}`;
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(config: RateLimitConfig) {
  return function <T extends (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>>(handler: T): T {
    return (async (request: NextRequest, ...args: unknown[]) => {
      try {
        // Clean expired entries periodically
        if (Math.random() < 0.01) { // 1% chance
          cleanExpiredEntries();
        }

        // Generate rate limit key
        const key = config.keyGenerator ? 
          config.keyGenerator(request) : 
          getDefaultKey(request);

        const now = Date.now();

        // Get or initialize rate limit data
        let rateLimitData = rateLimitStore[key];
        
        if (!rateLimitData || rateLimitData.resetTime < now) {
          // Create new window
          rateLimitData = {
            count: 0,
            resetTime: now + config.windowMs
          };
          rateLimitStore[key] = rateLimitData;
        }

        // Check if limit exceeded
        if (rateLimitData.count >= config.maxRequests) {
          const resetIn = Math.ceil((rateLimitData.resetTime - now) / 1000);
          
          return new NextResponse(
            JSON.stringify({
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests',
                details: `Rate limit exceeded. Try again in ${resetIn} seconds.`
              }
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': config.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimitData.resetTime.toString(),
                'Retry-After': resetIn.toString()
              }
            }
          );
        }

        // Increment counter
        rateLimitData.count++;

        // Call the handler
        const response = await handler(request, ...args);

        // Add rate limit headers to response
        const remaining = Math.max(0, config.maxRequests - rateLimitData.count);
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitData.resetTime.toString());

        return response;
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        // Continue without rate limiting on error
        return await handler(request, ...args);
      }
    }) as T;
  };
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  
  // API endpoints - moderate limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  
  // Public endpoints - lenient limits
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  
  // Heavy operations - very strict limits
  heavy: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 requests per hour
  }
} as const;

/**
 * Rate limit by user ID (requires authentication)
 */
export function createUserRateLimit(config: RateLimitConfig) {
  return withRateLimit({
    ...config,
    keyGenerator: (request: NextRequest) => {
      // Extract user ID from auth context if available
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        // This is a simplified approach - in practice you'd decode the token
        return `user:${authHeader}:${new URL(request.url).pathname}`;
      }
      return getDefaultKey(request);
    }
  });
}

/**
 * Rate limit by IP address only
 */
export function createIPRateLimit(config: RateLimitConfig) {
  return withRateLimit({
    ...config,
    keyGenerator: (request: NextRequest) => {
      const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
      return `ip:${ip}:${new URL(request.url).pathname}`;
    }
  });
}
