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
  tools: string[]
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

// Create data types - organizationId provided by auth context
export interface CreateAgentData {
  name: string
  description?: string
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
  rules?: PrismaJson.AgentRules
  tools?: string[]
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
  tools?: string[]
  isActive?: boolean
}

export interface CreateIntegrationData {
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

// Filter types - organizationId provided by auth context
export interface AgentFilters {
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
}

export interface IntegrationFilters {
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

// Customer Memory Types
export interface CustomerMemory {
  id: string
  customerId: string
  organizationId: string
  content: string
  memoryType: 'preference' | 'context' | 'fact'
  embedding?: number[] // Vector embedding
  metadata: Record<string, unknown>
  createdAt: Date
}

export interface CreateCustomerMemoryData {
  customerId: string
  organizationId: string
  content: string
  memoryType?: 'preference' | 'context' | 'fact'
  metadata?: Record<string, unknown>
}

export interface CustomerMemoryFilters {
  customerId?: string
  organizationId?: string
  memoryType?: 'preference' | 'context' | 'fact'
  limit?: number
  offset?: number
}

// Usage Record Types (Cost Tracking)
export interface UsageRecord {
  id: string
  organizationId: string
  agentId?: string | null
  model: string
  operation: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  inputCost: number
  outputCost: number
  totalCost: number
  source: string
  requestId?: string | null
  conversationId?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: Date
}

export interface CreateUsageRecordData {
  organizationId: string
  agentId?: string
  model: string
  operation: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  inputCost: number
  outputCost: number
  totalCost: number
  source: string
  requestId?: string
  conversationId?: string
  metadata?: Record<string, unknown>
}

export interface UsageRecordFilters {
  organizationId?: string
  agentId?: string
  model?: string
  operation?: string
  source?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface UsageRecordWithRelations extends UsageRecord {
  organization: Pick<Organization, 'name' | 'slug'>
  agent?: Pick<Agent, 'name'> | null
}

// Billing Config Types
export interface BillingConfig {
  id: string
  organizationId: string
  monthlyBudget?: number | null
  alertThreshold: number
  isActive: boolean
  preferredModel: string
  autoOptimize: boolean
  maxCostPerMessage?: number | null
  emailAlerts: boolean
  alertEmail?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateBillingConfigData {
  organizationId: string
  monthlyBudget?: number
  alertThreshold?: number
  preferredModel?: string
  autoOptimize?: boolean
  maxCostPerMessage?: number
  emailAlerts?: boolean
  alertEmail?: string
}

export interface UpdateBillingConfigData {
  monthlyBudget?: number | null
  alertThreshold?: number
  isActive?: boolean
  preferredModel?: string
  autoOptimize?: boolean
  maxCostPerMessage?: number | null
  emailAlerts?: boolean
  alertEmail?: string | null
}

export interface BillingConfigWithRelations extends BillingConfig {
  organization: Pick<Organization, 'name' | 'slug'>
}

// This file must be a module
export {}