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
    integration: Pick<Integration, 'id' | 'name' | 'type' | 'isActive' | 'credentials' | 'organizationId'>
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
  userCost: number
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
  userCost?: number
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

// Conversation and Message Types (Session-based Architecture)
export type ConversationStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED'
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM'

export interface Conversation {
  id: string
  organizationId: string
  agentId: string
  sessionId: string
  customerId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  title?: string | null
  status: ConversationStatus
  channel: string
  isArchived: boolean
  context?: PrismaJson.ConversationContext | null
  createdAt: Date
  updatedAt: Date
  lastMessageAt?: Date | null
}

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  tokenCount?: number | null
  finishReason?: string | null
  toolCalls?: PrismaJson.MessageToolCalls | null
  toolResults?: PrismaJson.MessageToolResults | null
  usageRecordId?: string | null
  createdAt: Date
}

export interface ConversationWithRelations extends Conversation {
  organization?: Pick<Organization, 'name' | 'slug'>
  agent?: Pick<Agent, 'id' | 'name' | 'model'>
  messages?: Message[]
  usageRecords?: Pick<UsageRecord, 'id' | 'totalCost' | 'totalTokens'>[]
  _count?: {
    messages: number
    usageRecords: number
  }
}

export interface MessageWithRelations extends Message {
  conversation?: Pick<Conversation, 'id' | 'sessionId' | 'title' | 'agentId'>
  usageRecord?: Pick<UsageRecord, 'id' | 'totalCost' | 'totalTokens' | 'model'> | null
}

// Create data types
export interface CreateConversationData {
  agentId: string
  sessionId: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  title?: string
  channel?: string
  context?: PrismaJson.ConversationContext
}

export interface UpdateConversationData {
  title?: string
  status?: ConversationStatus
  isArchived?: boolean
  context?: PrismaJson.ConversationContext
  customerId?: string
  customerName?: string
  customerEmail?: string
  lastMessageAt?: Date
}

export interface CreateMessageData {
  conversationId: string
  role: MessageRole
  content: string
  tokenCount?: number
  finishReason?: string
  toolCalls?: PrismaJson.MessageToolCalls
  toolResults?: PrismaJson.MessageToolResults
  usageRecordId?: string
}

export interface UpdateMessageData {
  content?: string
  tokenCount?: number
  finishReason?: string
  toolCalls?: PrismaJson.MessageToolCalls
  toolResults?: PrismaJson.MessageToolResults
  usageRecordId?: string
}

// Filter types
export interface ConversationFilters {
  agentId?: string
  sessionId?: string
  customerId?: string
  status?: ConversationStatus
  isArchived?: boolean
  search?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}

export interface MessageFilters {
  conversationId?: string
  role?: MessageRole
  search?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}

export interface SessionFilters {
  agentId?: string
  customerId?: string
  activeOnly?: boolean
  limit?: number
  offset?: number
}

// Session aggregation types
export interface SessionSummary {
  sessionId: string
  agentId: string
  conversationCount: number
  messageCount: number
  totalCost: number
  totalTokens: number
  lastActivity: Date
  firstConversation: Date
  customerId?: string | null
  customerName?: string | null
  latestTitle?: string | null
}

export interface ConversationStats {
  totalConversations: number
  activeConversations: number
  totalMessages: number
  totalCost: number
  totalTokens: number
  averageConversationLength: number
  averageCost: number
  topAgents: Array<{
    agentId: string
    agentName: string
    conversationCount: number
    messageCount: number
    totalCost: number
  }>
}

// Widget Configuration Types
export interface WidgetConfig {
  id: string
  agentId: string
  position: string
  theme: string
  primaryColor: string
  greeting?: string | null
  placeholder: string
  showPoweredBy: boolean
  allowedDomains: string[]
  customTheme?: PrismaJson.WidgetTheme | null
  triggers: PrismaJson.WidgetTriggers
  features: string[]
  customCSS?: string | null
  deployedAt?: Date | null
  lastAccessedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Organization Credits Types
export interface OrganizationCredits {
  id: string
  organizationId: string
  credits: number
  freeCredits: number
  paidCredits: number
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationCreditsWithRelations extends OrganizationCredits {
  organization?: Pick<Organization, 'name' | 'slug'>
}

export interface CreateOrganizationCreditsData {
  organizationId: string
  credits?: number
  freeCredits?: number
  paidCredits?: number
}

export interface UpdateOrganizationCreditsData {
  credits?: number
  freeCredits?: number
  paidCredits?: number
}

// Credit Transaction Types
export type TransactionType = 'CREDIT_PURCHASE' | 'USAGE_DEDUCTION' | 'FREE_CREDIT' | 'REFUND'

export interface CreditTransaction {
  id: string
  organizationId: string
  amount: number
  type: TransactionType
  description?: string | null
  metadata?: PrismaJson.CreditTransactionMetadata | null
  createdAt: Date
}

export interface CreditTransactionWithRelations extends CreditTransaction {
  organization?: Pick<Organization, 'name' | 'slug'>
}

export interface CreateCreditTransactionData {
  organizationId: string
  amount: number
  type: TransactionType
  description?: string
  metadata?: PrismaJson.CreditTransactionMetadata
}

export interface CreditTransactionFilters {
  organizationId?: string
  type?: TransactionType
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface WidgetConfigWithRelations extends WidgetConfig {
  agent?: Pick<Agent, 'id' | 'name' | 'isActive' | 'organizationId'>
}

export interface CreateWidgetConfigData {
  agentId: string
  position?: string
  theme?: string
  primaryColor?: string
  greeting?: string
  placeholder?: string
  showPoweredBy?: boolean
  allowedDomains?: string[]
  customTheme?: PrismaJson.WidgetTheme
  triggers?: PrismaJson.WidgetTriggers
  features?: string[]
  customCSS?: string
}

export interface UpdateWidgetConfigData {
  position?: string
  theme?: string
  primaryColor?: string
  greeting?: string | null
  placeholder?: string
  showPoweredBy?: boolean
  allowedDomains?: string[]
  customTheme?: PrismaJson.WidgetTheme | null
  triggers?: PrismaJson.WidgetTriggers
  features?: string[]
  customCSS?: string | null
  deployedAt?: Date | null
  lastAccessedAt?: Date | null
}

// This file must be a module
export {}