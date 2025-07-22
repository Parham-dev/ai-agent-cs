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
        guardrails?: {
          input?: string[]
          output?: string[]
          customInstructions?: {
            input?: string
            output?: string
          }
        }
      }
      [key: string]: unknown
    }

    // New conversation and message types for session-based architecture
    interface ConversationContext {
      // Customer context
      customerPreferences?: Record<string, unknown>
      customerHistory?: string[]
      
      // Session state
      sessionData?: Record<string, unknown>
      variables?: Record<string, unknown>
      
      // Agent behavior for this conversation
      agentOverrides?: {
        temperature?: number
        model?: string
        systemPromptAddition?: string
      }
      
      // Integration context
      integrationState?: Record<string, Record<string, unknown>>
      
      [key: string]: unknown
    }

    // Tool calls made in a message
    type MessageToolCalls = MessageToolCall[]
    
    interface MessageToolCall {
      id: string
      name: string
      arguments: Record<string, unknown>
      timestamp: string
    }

    // Tool execution results for a message
    type MessageToolResults = MessageToolResult[]
    
    interface MessageToolResult {
      toolCallId: string
      result: unknown
      success: boolean
      error?: string
      timestamp: string
      executionTime?: number
    }

    // Usage metadata for cost tracking
    interface UsageMetadata {
      requestId?: string
      modelUsed?: string
      toolsUsed?: string[]
      customerContext?: {
        customerId?: string
        sessionId?: string
      }
      performance?: {
        responseTime?: number
        tokenProcessingTime?: number
      }
      [key: string]: unknown
    }

    // Widget theme configuration
    interface WidgetTheme {
      background?: string
      foreground?: string
      primary?: string
      secondary?: string
      accent?: string
      border?: string
      chatBackground?: string
      fontFamily?: string
      fontSize?: string
      borderRadius?: string
      boxShadow?: string
      userMessageColor?: string
      botMessageColor?: string
      [key: string]: string | undefined
    }

    // Widget trigger configuration
    interface WidgetTriggers {
      showAfter?: number         // Show after X milliseconds
      showOnScroll?: number      // Show after scrolling X percent
      showOnExit?: boolean       // Show on exit intent
      hideOnMobile?: boolean     // Hide on mobile devices
      showOnPages?: string[]     // Show only on specific pages
      hideOnPages?: string[]     // Hide on specific pages
      customTriggers?: {
        event: string
        action: 'show' | 'hide' | 'toggle'
        condition?: string
      }[]
    }
  }
}

// This file must be a module
export {}