import { BaseCredentialProvider } from './provider'
import { prisma } from '@/lib/database/database'
import { encryptionService } from '@/lib/services'
import { logger } from '@/lib/utils/logger'
import type { IntegrationCredentials, CustomMcpCredentials } from '@/lib/types/integrations'

/**
 * Database credential provider
 * Retrieves credentials from database integrations
 */
export class DatabaseCredentialProvider<T = Record<string, unknown>> extends BaseCredentialProvider<T> {
  constructor(
    type: string,
    private organizationId?: string
  ) {
    super(type)
  }

  async getCredentials(context?: unknown): Promise<T | null> {
    try {
      logger.info('🔍 DATABASE CREDENTIAL PROVIDER - Starting', {
        integrationType: this.type,
        hasContext: !!context,
        hasOrganizationId: !!this.organizationId,
        timestamp: new Date().toISOString()
      })

      // Extract organization ID from request if not provided
      let orgId = this.organizationId
      
      if (!orgId && context && typeof context === 'object' && 'headers' in context) {
        const request = context as Request
        orgId = request.headers.get('x-organization-id') || undefined
      }

      if (!orgId) {
        // Try to get from the first active integration (fallback for testing)
        const firstIntegration = await prisma.integration.findFirst({
          where: {
            type: this.type.replace('-mcp-server', ''), // Remove suffix if present
            isActive: true
          }
        })
        
        if (firstIntegration) {
          orgId = firstIntegration.organizationId
        }
      }

      if (!orgId) {
        logger.warn('No organization ID available for database credential lookup')
        return null
      }

      // Get integration from database
      const integration = await prisma.integration.findFirst({
        where: {
          organizationId: orgId,
          type: this.type.replace('-mcp-server', ''), // Remove suffix if present
          isActive: true
        }
      })

      if (!integration) {
        logger.warn('No active integration found in database', {
          organizationId: orgId,
          integrationType: this.type
        })
        return null
      }

      // Decrypt credentials
      const decryptedCredentials = await encryptionService.decryptCredentials<IntegrationCredentials | CustomMcpCredentials>(
        integration.credentials
      )

      logger.info('✅ DATABASE CREDENTIAL PROVIDER - Retrieved credentials', {
        integrationId: integration.id,
        integrationType: integration.type,
        hasCredentials: !!decryptedCredentials,
        timestamp: new Date().toISOString()
      })

      return decryptedCredentials as T
    } catch (error) {
      logger.error('❌ DATABASE CREDENTIAL PROVIDER - Failed to get credentials', {
        integrationType: this.type,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
      return null
    }
  }
}