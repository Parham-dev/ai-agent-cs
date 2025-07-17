// Database schema types - pure database entity types with Date objects
// These are used internally by services and database operations

// Core Database Entity Types
export interface Organization {
  id: string
  name: string
  slug: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Integration {
  id: string
  organizationId: string
  name: string
  type: string
  description?: string | null
  isActive: boolean
  credentials: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Agent {
  id: string
  organizationId: string
  name: string
  description?: string | null
  isActive: boolean
  systemPrompt?: string | null
  model: string
  temperature: number
  maxTokens: number
  rules?: PrismaJson.AgentRules | null
  createdAt: Date
  updatedAt: Date
}

export interface AgentIntegration {
  id: string
  agentId: string
  integrationId: string
  isEnabled: boolean
  selectedTools: string[]
  config?: PrismaJson.AgentIntegrationConfig | null
  createdAt: Date
  updatedAt: Date
}

// Extended types for database operations
export interface OrganizationWithStats extends Organization {
  _count?: {
    agents: number
    integrations: number
    conversations: number
  }
}

export interface OrganizationWithRelations extends Organization {
  agents?: Pick<Agent, 'id' | 'name' | 'isActive'>[]
  integrations?: Pick<Integration, 'id' | 'type' | 'name' | 'isActive'>[]
}

export interface AgentWithRelations extends Agent {
  organization?: Pick<Organization, 'name' | 'slug'>
  agentIntegrations?: (AgentIntegration & {
    integration: Pick<Integration, 'id' | 'name' | 'type' | 'isActive' | 'credentials'>
  })[]
}

export interface IntegrationWithRelations extends Integration {
  organization?: Pick<Organization, 'name' | 'slug'>
  agentIntegrations?: Pick<AgentIntegration, 'agentId' | 'isEnabled' | 'selectedTools'>[]
}

// Database operation types
export interface CreateOrganizationData {
  name: string
  slug: string
  description?: string
}

export interface UpdateOrganizationData {
  name?: string
  slug?: string
  description?: string
}

export interface CreateAgentData {
  organizationId: string
  name: string
  description?: string
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
  rules?: PrismaJson.AgentRules
  isActive?: boolean
}

export interface UpdateAgentData {
  name?: string
  description?: string
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
  rules?: PrismaJson.AgentRules
  isActive?: boolean
}

export interface CreateIntegrationData {
  organizationId: string
  name: string
  type: string
  description?: string
  credentials: Record<string, unknown>
  isActive?: boolean
}

export interface UpdateIntegrationData {
  name?: string
  description?: string
  credentials?: Record<string, unknown>
  isActive?: boolean
}

export interface CreateAgentIntegrationData {
  agentId: string
  integrationId: string
  selectedTools: string[]
  config?: PrismaJson.AgentIntegrationConfig
  isEnabled?: boolean
}

export interface UpdateAgentIntegrationData {
  selectedTools?: string[]
  config?: PrismaJson.AgentIntegrationConfig
  isEnabled?: boolean
}

// Database filter types
export interface AgentFilters {
  organizationId?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface IntegrationFilters {
  organizationId?: string
  type?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface OrganizationFilters {
  search?: string
  limit?: number
  offset?: number
}

// This file must be a module
export {}