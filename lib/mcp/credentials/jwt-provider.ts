import { BaseCredentialProvider } from './provider'
import { getCredentialsFromRequest } from '@/lib/mcp/auth/jwt-credentials'
import { logger } from '@/lib/utils/logger'

/**
 * JWT credential provider
 * Retrieves credentials from JWT tokens in request headers
 */
export class JWTCredentialProvider<T = Record<string, unknown>> extends BaseCredentialProvider<T> {
  constructor(
    type: string,
    private expectedIntegrationType: string
  ) {
    super(type)
  }

  async getCredentials(context?: unknown): Promise<T | null> {
    if (!context || typeof context !== 'object' || !('headers' in context)) {
      logger.debug('JWT provider: No request context available')
      return null
    }

    const request = context as Request
    const tokenData = getCredentialsFromRequest(request)

    if (!tokenData) {
      logger.debug('JWT provider: No valid token found')
      return null
    }

    // Verify the integration type matches
    if (tokenData.integrationType !== this.expectedIntegrationType) {
      logger.warn('JWT provider: Integration type mismatch', {
        expected: this.expectedIntegrationType,
        actual: tokenData.integrationType
      })
      return null
    }

    logger.info('✅ JWT provider: Successfully retrieved credentials', {
      organizationId: tokenData.organizationId,
      integrationType: tokenData.integrationType
    })

    return tokenData.credentials as T
  }
}