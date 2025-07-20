import { prisma } from '@/lib/database/database'
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/utils/errors'
import type {
  WidgetConfig,
  WidgetConfigWithRelations,
  CreateWidgetConfigData,
  UpdateWidgetConfigData,
} from '@/lib/types/database'

class WidgetConfigsService {
  /**
   * Get widget config by agent ID
   */
  async getWidgetConfigByAgentId(agentId: string): Promise<WidgetConfigWithRelations | null> {
    try {
      const widgetConfig = await prisma.widgetConfig.findUnique({
        where: { agentId },
        include: {
          agent: {
            select: { id: true, name: true, isActive: true, organizationId: true }
          }
        }
      })

      return widgetConfig as WidgetConfigWithRelations | null
    } catch (error) {
      throw new DatabaseError(`Failed to fetch widget config for agent ${agentId}`, error as Error)
    }
  }

  /**
   * Get widget config by agent ID or throw error if not found
   */
  async getWidgetConfigByAgentIdOrThrow(agentId: string): Promise<WidgetConfigWithRelations> {
    const widgetConfig = await this.getWidgetConfigByAgentId(agentId)
    if (!widgetConfig) {
      throw new NotFoundError('WidgetConfig', agentId)
    }
    return widgetConfig
  }

  /**
   * Create widget config for an agent
   */
  async createWidgetConfig(data: CreateWidgetConfigData): Promise<WidgetConfig> {
    try {
      // Check if widget config already exists for this agent
      const existingConfig = await prisma.widgetConfig.findUnique({
        where: { agentId: data.agentId }
      })

      if (existingConfig) {
        throw new ValidationError('Widget configuration already exists for this agent')
      }

      const widgetConfig = await prisma.widgetConfig.create({
        data: {
          agentId: data.agentId,
          position: data.position || 'bottom-right',
          theme: data.theme || 'auto',
          primaryColor: data.primaryColor || '#007bff',
          greeting: data.greeting,
          placeholder: data.placeholder || 'Type your message...',
          showPoweredBy: data.showPoweredBy ?? true,
          allowedDomains: data.allowedDomains || ['*'],
          customTheme: data.customTheme || {},
          triggers: data.triggers || {},
          features: data.features || ['chat', 'typing-indicator'],
          customCSS: data.customCSS,
        }
      })

      return widgetConfig
    } catch (error) {
      if (error instanceof ValidationError) throw error
      throw new DatabaseError('Failed to create widget config', error as Error)
    }
  }

  /**
   * Update widget config
   */
  async updateWidgetConfig(agentId: string, data: UpdateWidgetConfigData): Promise<WidgetConfig> {
    try {
      // Check if widget config exists
      const existingConfig = await this.getWidgetConfigByAgentId(agentId)
      if (!existingConfig) {
        throw new NotFoundError('WidgetConfig', agentId)
      }

      const widgetConfig = await prisma.widgetConfig.update({
        where: { agentId },
        data: {
          position: data.position,
          theme: data.theme,
          primaryColor: data.primaryColor,
          greeting: data.greeting,
          placeholder: data.placeholder,
          showPoweredBy: data.showPoweredBy,
          allowedDomains: data.allowedDomains,
          customTheme: data.customTheme || undefined,
          triggers: data.triggers || undefined,
          features: data.features,
          customCSS: data.customCSS,
          deployedAt: data.deployedAt,
          lastAccessedAt: data.lastAccessedAt,
          updatedAt: new Date(),
        }
      })

      return widgetConfig
    } catch (error) {
      if (error instanceof NotFoundError) throw error
      throw new DatabaseError(`Failed to update widget config for agent ${agentId}`, error as Error)
    }
  }

  /**
   * Update or create widget config
   */
  async upsertWidgetConfig(data: CreateWidgetConfigData): Promise<WidgetConfig> {
    try {
      const widgetConfig = await prisma.widgetConfig.upsert({
        where: { agentId: data.agentId },
        update: {
          position: data.position,
          theme: data.theme,
          primaryColor: data.primaryColor,
          greeting: data.greeting,
          placeholder: data.placeholder,
          showPoweredBy: data.showPoweredBy,
          allowedDomains: data.allowedDomains,
          customTheme: data.customTheme || undefined,
          triggers: data.triggers || undefined,
          features: data.features,
          customCSS: data.customCSS,
          updatedAt: new Date(),
        },
        create: {
          agentId: data.agentId,
          position: data.position || 'bottom-right',
          theme: data.theme || 'auto',
          primaryColor: data.primaryColor || '#007bff',
          greeting: data.greeting,
          placeholder: data.placeholder || 'Type your message...',
          showPoweredBy: data.showPoweredBy ?? true,
          allowedDomains: data.allowedDomains || ['*'],
          customTheme: data.customTheme || {},
          triggers: data.triggers || {},
          features: data.features || ['chat', 'typing-indicator'],
          customCSS: data.customCSS,
        }
      })

      return widgetConfig
    } catch (error) {
      throw new DatabaseError('Failed to upsert widget config', error as Error)
    }
  }

  /**
   * Delete widget config
   */
  async deleteWidgetConfig(agentId: string): Promise<void> {
    try {
      await prisma.widgetConfig.delete({
        where: { agentId }
      })
    } catch (error) {
      throw new DatabaseError(`Failed to delete widget config for agent ${agentId}`, error as Error)
    }
  }

  /**
   * Mark widget as deployed
   */
  async markWidgetAsDeployed(agentId: string): Promise<WidgetConfig> {
    try {
      const widgetConfig = await prisma.widgetConfig.update({
        where: { agentId },
        data: {
          deployedAt: new Date(),
          updatedAt: new Date(),
        }
      })

      return widgetConfig
    } catch (error) {
      throw new DatabaseError(`Failed to mark widget as deployed for agent ${agentId}`, error as Error)
    }
  }

  /**
   * Update last accessed timestamp
   */
  async updateLastAccessed(agentId: string): Promise<void> {
    try {
      await prisma.widgetConfig.update({
        where: { agentId },
        data: {
          lastAccessedAt: new Date(),
        }
      })
    } catch (error) {
      // Don't throw error for analytics update
      console.error(`Failed to update last accessed for agent ${agentId}:`, error)
    }
  }

  /**
   * Validate domain against allowed domains
   */
  async validateDomain(agentId: string, domain: string): Promise<boolean> {
    try {
      const widgetConfig = await this.getWidgetConfigByAgentId(agentId)
      if (!widgetConfig) {
        return false
      }

      // If allowed domains includes "*", allow all domains
      if (widgetConfig.allowedDomains.includes('*')) {
        return true
      }

      // Check exact match
      if (widgetConfig.allowedDomains.includes(domain)) {
        return true
      }

      // Check wildcard subdomain match (e.g., *.example.com)
      for (const allowedDomain of widgetConfig.allowedDomains) {
        if (allowedDomain.startsWith('*.')) {
          const baseDomain = allowedDomain.slice(2)
          if (domain.endsWith(baseDomain)) {
            return true
          }
        }
      }

      return false
    } catch (error) {
      console.error(`Failed to validate domain for agent ${agentId}:`, error)
      return false
    }
  }
}

// Export singleton instance
export const widgetConfigsService = new WidgetConfigsService()