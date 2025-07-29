/**
 * JWT-based credential management for MCP servers
 * This allows us to pass organization context and credentials securely
 */

import jwt from 'jsonwebtoken'
import { logger } from '@/lib/utils/logger'
import type { IntegrationCredentials, CustomMcpCredentials } from '@/lib/types/integrations'

export interface MCPJWTPayload {
  organizationId: string
  integrationType: string
  credentials: IntegrationCredentials | CustomMcpCredentials
  exp?: number
  iat?: number
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'fallback-secret'
const TOKEN_EXPIRY = '1h' // 1 hour expiry for security

/**
 * Create a JWT token containing credentials for MCP server authentication
 */
export function createMCPToken(
  organizationId: string,
  integrationType: string,
  credentials: IntegrationCredentials | CustomMcpCredentials
): string {
  const payload: MCPJWTPayload = {
    organizationId,
    integrationType,
    credentials
  }

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: TOKEN_EXPIRY,
    issuer: 'ai-customer-service-mcp'
  })
}

/**
 * Verify and decode an MCP JWT token
 */
export function verifyMCPToken(token: string): MCPJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ai-customer-service-mcp'
    }) as MCPJWTPayload

    logger.debug('JWT token verified successfully', {
      organizationId: decoded.organizationId,
      integrationType: decoded.integrationType,
      hasCredentials: !!decoded.credentials
    })

    return decoded
  } catch (error) {
    logger.error('Failed to verify JWT token', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    return null
  }
}

/**
 * Extract MCP token from request headers
 */
export function extractMCPTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Also check custom MCP header
  return request.headers.get('x-mcp-token')
}

/**
 * Get credentials from JWT token in request
 */
export function getCredentialsFromRequest(request: Request): {
  organizationId: string
  integrationType: string
  credentials: IntegrationCredentials | CustomMcpCredentials
} | null {
  const token = extractMCPTokenFromRequest(request)
  
  if (!token) {
    logger.warn('No MCP token found in request')
    return null
  }
  
  const payload = verifyMCPToken(token)
  
  if (!payload) {
    logger.warn('Invalid MCP token in request')
    return null
  }
  
  return {
    organizationId: payload.organizationId,
    integrationType: payload.integrationType,
    credentials: payload.credentials
  }
}