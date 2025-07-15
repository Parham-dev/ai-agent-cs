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

    // Integration credentials - type varies by integration type
    interface IntegrationCredentials {
      // Shopify
      storeDomain?: string
      accessToken?: string
      
      // Stripe
      secretKey?: string
      publicKey?: string
      webhookSecret?: string
      
      // Generic OAuth
      clientId?: string
      clientSecret?: string
      refreshToken?: string
      
      // API Keys
      apiKey?: string
      apiSecret?: string
      
      // Custom fields for other integrations
      [key: string]: unknown
    }

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
  }
}

// This file must be a module
export {}