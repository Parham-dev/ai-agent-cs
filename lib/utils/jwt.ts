/**
 * JWT utilities for widget authentication
 */

import { verify } from 'jsonwebtoken';
import { createLogger } from './logger';

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