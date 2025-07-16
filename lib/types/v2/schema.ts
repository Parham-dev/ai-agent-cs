// V2 Types for the new normalized schema
// Following existing patterns with proper TypeScript interfaces

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace PrismaJsonV2 {
    // Agent rules and behavior settings (simplified from current agentConfig)
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

    // Agent-specific integration configuration
    interface AgentIntegrationConfig {
      syncSettings?: {
        autoSync?: boolean
        syncInterval?: number
      }
      customMappings?: Record<string, string>
      preferences?: {
        [key: string]: unknown
      }
      [key: string]: unknown
    }
  }
}

// V2 Schema Types
export interface OrganizationV2 {
  id: string
  name: string
  slug: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IntegrationV2 {
  id: string
  organizationId: string
  name: string
  type: string
  description?: string | null
  isActive: boolean
  credentials: Record<string, unknown> // Keep as JSON since each integration has different fields
  createdAt: Date
  updatedAt: Date
}

export interface AgentV2 {
  id: string
  organizationId: string
  name: string
  description?: string | null
  isActive: boolean
  systemPrompt?: string | null
  model: string
  temperature: number
  maxTokens: number
  rules?: PrismaJsonV2.AgentRules | null
  createdAt: Date
  updatedAt: Date
}

export interface AgentIntegrationV2 {
  id: string
  agentId: string
  integrationId: string
  isEnabled: boolean
  selectedTools: string[] // Tools from MCP server this agent can use
  config?: PrismaJsonV2.AgentIntegrationConfig | null
  createdAt: Date
  updatedAt: Date
}

// Extended types for API responses
export interface AgentV2WithRelations extends AgentV2 {
  organization?: Pick<OrganizationV2, 'name' | 'slug'>
  agentIntegrations?: (AgentIntegrationV2 & {
    integration: Pick<IntegrationV2, 'id' | 'name' | 'type' | 'isActive' | 'credentials'>
  })[]
}

export interface IntegrationV2WithRelations extends IntegrationV2 {
  organization?: Pick<OrganizationV2, 'name' | 'slug'>
  agentIntegrations?: Pick<AgentIntegrationV2, 'agentId' | 'isEnabled' | 'selectedTools'>[]
}

// Create/Update types
export interface CreateAgentV2Data {
  organizationId: string
  name: string
  description?: string
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
  rules?: PrismaJsonV2.AgentRules
  isActive?: boolean
}

export interface UpdateAgentV2Data {
  name?: string
  description?: string
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
  rules?: PrismaJsonV2.AgentRules
  isActive?: boolean
}

export interface CreateIntegrationV2Data {
  organizationId: string
  name: string
  type: string
  description?: string
  credentials: Record<string, unknown>
  isActive?: boolean
}

export interface UpdateIntegrationV2Data {
  name?: string
  description?: string
  credentials?: Record<string, unknown>
  isActive?: boolean
}

export interface CreateAgentIntegrationV2Data {
  agentId: string
  integrationId: string
  selectedTools: string[]
  config?: PrismaJsonV2.AgentIntegrationConfig
  isEnabled?: boolean
}

export interface UpdateAgentIntegrationV2Data {
  selectedTools?: string[]
  config?: PrismaJsonV2.AgentIntegrationConfig
  isEnabled?: boolean
}

// Filter types
export interface AgentV2Filters {
  organizationId?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface IntegrationV2Filters {
  organizationId?: string
  type?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

// This file must be a module
export {}
