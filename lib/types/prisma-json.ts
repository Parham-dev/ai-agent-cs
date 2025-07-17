// Prisma JSON type declarations
// This file defines strongly typed interfaces for JSON fields in our Prisma schema

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace PrismaJson {
    // Organization settings type
    interface OrganizationSettings {
      theme?: 'light' | 'dark' | 'auto'
      timezone?: string
      industry?: string
      notifications?: {
        email?: boolean
        slack?: boolean
        webhook?: string
      }
      branding?: {
        logo?: string
        primaryColor?: string
        secondaryColor?: string
      }
    }

    // Use centralized IntegrationCredentials from @/lib/types/integrations

    // Integration settings - non-sensitive configuration
    interface IntegrationSettings {
      // Sync settings
      syncProducts?: boolean
      syncInventory?: boolean
      syncOrders?: boolean
      syncCustomers?: boolean
      
      // Webhook settings
      webhookUrl?: string
      webhookEvents?: string[]
      
      // Rate limiting
      rateLimitPerSecond?: number
      
      // Custom mappings
      fieldMappings?: Record<string, string>
      
      // Feature flags
      features?: {
        [feature: string]: boolean
      }
      
      // Custom fields
      [key: string]: unknown
    }

    // Conversation messages - array of message objects
    type ConversationMessages = ConversationMessage[]
    
    interface ConversationMessage {
      id: string
      senderType: 'customer' | 'ai' | 'human'
      content: string
      timestamp: string
      metadata?: {
        confidence?: number
        toolsUsed?: string[]
        responseTime?: number
        [key: string]: unknown
      }
    }

    // Agent rules and behavior settings (for V2 schema)
    interface AgentRules {
      canAccessCustomerData?: boolean
      canProcessPayments?: boolean
      canCreateOrders?: boolean
      escalationRules?: {
        keywords?: string[]
        conditions?: string[]
        action?: 'escalate' | 'flag' | 'transfer'
      }[]
      responseStyle?: 'formal' | 'casual' | 'friendly'
      maxResponseLength?: number
      contextWindow?: number
      [key: string]: unknown
    }

    // Agent-specific integration configuration (for V2 schema)
    interface AgentIntegrationConfig {
      syncSettings?: {
        autoSync?: boolean
        syncInterval?: number
      }
      customMappings?: Record<string, string>
      preferences?: Record<string, unknown>
      [key: string]: unknown
    }

    // Agent configuration data - complete agent configuration
    interface AgentConfigData {
      name?: string
      instructions?: string
      model?: string
      tools?: string[]
      integrations?: {
        id: string // ID of the organization integration
        selectedTools?: string[] // Which tools from this integration to enable
        settings?: IntegrationSettings // Agent-specific integration settings
      }[]
      behavior?: {
        responseStyle?: 'formal' | 'casual' | 'friendly'
        maxResponseLength?: number
        contextWindow?: number
        temperature?: number
      }
      rules?: {
        canAccessCustomerData?: boolean
        canProcessPayments?: boolean
        canCreateOrders?: boolean
        escalationRules?: {
          keywords?: string[]
          conditions?: string[]
          action?: 'escalate' | 'flag' | 'transfer'
        }[]
      }
      [key: string]: unknown
    }
  }
}

// This file must be a module
export {}