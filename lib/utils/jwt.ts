/**
 * JWT utilities for widget authentication and Supabase JWT metadata extraction
 */

import { verify } from 'jsonwebtoken';
import { createLogger } from './logger';
import type { JWTMetadata } from '@/lib/types/auth';

const logger = createLogger('jwt');

export interface WidgetTokenPayload {
  agentId: string;
  organizationId: string;
  domain: string;
  timestamp: number;
  type: 'widget-session';
  exp: number;
  iat: number;
}

/**
 * Verify and decode a widget session token
 */
export function verifyWidgetToken(token: string): WidgetTokenPayload | null {
  try {
    const secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    const decoded = verify(token, secretKey) as WidgetTokenPayload;
    
    // Validate token type
    if (decoded.type !== 'widget-session') {
      logger.warn('Invalid token type', { type: decoded.type });
      return null;
    }
    
    // Token is valid
    logger.debug('Widget token verified successfully', {
      agentId: decoded.agentId,
      domain: decoded.domain
    });
    
    return decoded;
  } catch (error) {
    logger.error('Widget token verification failed', {}, error as Error);
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Safely decode JWT metadata from Supabase JWT token
 * Does NOT verify signature - assumes token was already verified by Supabase
 */
export function decodeSupabaseJWTMetadata(token: string): JWTMetadata | null {
  try {
    // Split JWT into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.warn('Invalid JWT format - expected 3 parts');
      return null;
    }

    // Decode payload (second part)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    );

    // Extract app_metadata containing our custom claims
    const appMetadata = payload.app_metadata;
    if (!appMetadata || typeof appMetadata !== 'object') {
      logger.debug('No app_metadata found in JWT token');
      return null;
    }

    // Validate and extract JWT metadata
    const metadata: JWTMetadata = {
      userId: appMetadata.userId || null,
      organizationId: appMetadata.organizationId || null,
      role: appMetadata.role || 'USER'
    };

    logger.debug('Extracted JWT metadata', { 
      hasUserId: !!metadata.userId,
      hasOrgId: !!metadata.organizationId,
      role: metadata.role 
    });

    return metadata;
  } catch (error) {
    logger.error('Failed to decode JWT metadata', {}, error as Error);
    return null;
  }
}

/**
 * Extract organization ID from Supabase JWT token
 * Convenience function for the most common use case
 */
export function extractOrganizationIdFromJWT(token: string): string | null {
  const metadata = decodeSupabaseJWTMetadata(token);
  return metadata?.organizationId || null;
}

/**
 * Cache for decoded JWT metadata to avoid repeated parsing
 */
const jwtMetadataCache = new Map<string, { metadata: JWTMetadata | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get JWT metadata with caching to improve performance
 */
export function getCachedJWTMetadata(token: string): JWTMetadata | null {
  const now = Date.now();
  const cached = jwtMetadataCache.get(token);
  
  // Return cached result if valid and not expired
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    logger.debug('Using cached JWT metadata');
    return cached.metadata;
  }

  // Decode and cache new result
  const metadata = decodeSupabaseJWTMetadata(token);
  jwtMetadataCache.set(token, { metadata, timestamp: now });

  // Clean up old cache entries (simple cleanup)
  if (jwtMetadataCache.size > 100) {
    const entries = Array.from(jwtMetadataCache.entries());
    const expired = entries.filter(([, value]) => (now - value.timestamp) >= CACHE_TTL);
    expired.forEach(([key]) => jwtMetadataCache.delete(key));
  }

  logger.debug('Cached new JWT metadata', { hasMetadata: !!metadata });
  return metadata;
}