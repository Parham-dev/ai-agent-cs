# 🗄️ Database Schema - AI Customer Service Platform

This document outlines the complete database schema for the AI Customer Service Platform using Prisma ORM and PostgreSQL.

## 📊 Schema Overview

The database is designed to support:
- Multi-tenant organizations with custom domains
- Modular integration system (Shopify, Stripe, MCP servers, etc.)
- Universal AI agent configuration with dynamic tool loading
- Omnichannel customer service communications
- Knowledge management and AI embeddings
- Analytics, billing, and usage tracking
- Real-time conversation management

## 🔧 Prisma Schema

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =====================================
// ENUMS
// =====================================

// User roles within an organization
enum UserRole {
  owner           // Organization owner
  admin           // Full admin access
  agent           // Customer service agent
  manager         // Team manager
  viewer          // Read-only access
}

// Conversation status
enum ConversationStatus {
  open            // Active conversation
  pending         // Waiting for agent
  resolved        // Conversation resolved
  closed          // Conversation closed
  escalated       // Escalated to human
}

// Message types
enum MessageType {
  text            // Text message
  image           // Image attachment
  file            // File attachment
  audio           // Audio message
  video           // Video message
  system          // System notification
  ai_response     // AI-generated response
}

// Communication channels
enum ChannelType {
  web_widget      // Website chat widget
  sms             // SMS messaging
  email           // Email support
  voice           // Voice calls
  whatsapp        // WhatsApp integration
  facebook        // Facebook Messenger
  instagram       // Instagram DM
  twitter         // Twitter DM
  telegram        // Telegram bot
}

// Agent types
enum AgentType {
  triage          // Initial conversation routing
  support         // General customer support
  sales           // Sales inquiries
  technical       // Technical support
  billing         // Billing inquiries
  product         // Product information
  custom          // Custom specialized agent
}

// Integration types for our modular system
enum IntegrationType {
  shopify         // Shopify e-commerce
  stripe          // Stripe payments
  woocommerce     // WooCommerce
  magento         // Magento
  bigcommerce     // BigCommerce
  squarespace     // Squarespace
  wordpress       // WordPress
  salesforce      // Salesforce CRM
  hubspot         // HubSpot CRM
  zendesk         // Zendesk support
  intercom        // Intercom messaging
  slack           // Slack integration
  discord         // Discord bot
  mcp_server      // MCP server integration
  custom_api      // Custom API integration
}

// Integration status
enum IntegrationStatus {
  inactive        // Not configured
  validating      // Credentials being validated
  active          // Working correctly
  error           // Has configuration errors
  disconnected    // Temporarily disconnected
}

// Knowledge base content types
enum ContentType {
  faq             // Frequently asked questions
  documentation   // Product documentation
  policy          // Company policies
  procedure       // Support procedures
  training        // Training materials
  custom          // Custom content
}

// System cost types (what we pay for)
enum SystemCostType {
  ai_tokens_input   // AI input tokens we pay for
  ai_tokens_output  // AI output tokens we pay for
  sms_delivery      // SMS delivery costs
  email_delivery    // Email delivery costs
  voice_minutes     // Voice call minutes
  api_calls         // API calls to integrations
  storage_usage     // File storage usage
  bandwidth_usage   // Bandwidth usage
}

// Subscription plans
enum SubscriptionPlan {
  free            // Free tier
  starter         // Starter plan
  pro             // Pro plan
  enterprise      // Enterprise plan
  custom          // Custom enterprise
}

// =====================================
// ORGANIZATION & USER MANAGEMENT
// =====================================

model Organization {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique                // URL-friendly identifier
  domain          String?                          // Custom domain
  logoUrl         String?                          // Organization logo
  website         String?                          // Company website
  industry        String?                          // Industry vertical
  size            String?                          // Company size
  timezone        String    @default("UTC")       // Default timezone
  locale          String    @default("en")        // Default locale
  
  // Subscription & billing
  subscriptionPlan     SubscriptionPlan @default(free)
  subscriptionStatus   String           @default("active")
  subscriptionEndsAt   DateTime?
  billingEmail         String?
  
  // Settings
  settings        Json      @default("{}")        // Flexible settings storage
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  users           OrganizationUser[]
  conversations   Conversation[]
  agents          Agent[]
  integrations    Integration[]
  knowledgeBase   KnowledgeBaseItem[]
  channels        Channel[]
  analytics       Analytics[]
  billing         BillingUsage[]
  
  @@map("organizations")
}

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String
  avatar          String?
  timezone        String    @default("UTC")
  locale          String    @default("en")
  isActive        Boolean   @default(true)
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  organizations   OrganizationUser[]
  conversations   Conversation[]     // Conversations handled by this user
  messages        Message[]          // Messages sent by this user
  
  @@map("users")
}

model OrganizationUser {
  id             String    @id @default(cuid())
  organizationId String
  userId         String
  role           UserRole  @default(agent)
  isActive       Boolean   @default(true)
  joinedAt       DateTime  @default(now())
  
  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([organizationId, userId])
  @@map("organization_users")
}

// =====================================
// INTEGRATION MANAGEMENT
// =====================================

model Integration {
  id              String            @id @default(cuid())
  organizationId  String
  type            IntegrationType
  name            String                          // "Main Shopify Store", "Stripe Payments"
  description     String?                         // Optional description
  
  // Status and health
  status          IntegrationStatus @default(inactive)
  lastValidatedAt DateTime?
  lastErrorAt     DateTime?
  lastError       String?
  
  // Configuration (encrypted sensitive data)
  credentials     Json              @default("{}")  // Encrypted credentials
  settings        Json              @default("{}")  // Non-sensitive settings
  
  // Metadata
  version         String?                          // Integration version
  capabilities    String[]          @default([])   // Available capabilities
  isActive        Boolean           @default(true)
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  // Relations
  organization    Organization      @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  agentTools      AgentTool[]       // Tools generated from this integration
  
  @@unique([organizationId, type, name])
  @@index([organizationId, status])
  @@map("integrations")
}

// =====================================
// AI AGENTS & CONFIGURATION
// =====================================

model Agent {
  id              String     @id @default(cuid())
  organizationId  String
  name            String                        // "Support Agent", "Sales Agent"
  type            AgentType
  description     String?
  
  // AI Configuration
  instructions    String                        // AI instructions/prompt
  model           String     @default("gpt-4o") // AI model to use
  temperature     Float      @default(0.7)     // AI temperature setting
  maxTokens       Int        @default(4000)    // Max response tokens
  
  // Agent behavior
  isActive        Boolean    @default(true)
  priority        Int        @default(0)       // Agent priority for routing
  triggerKeywords String[]   @default([])      // Keywords that trigger this agent
  fallbackMessage String?                      // Message when agent can't help
  
  // Universal agent configuration (matches our API format)
  agentConfig     Json       @default("{}")    // Full agent configuration
  
  // Performance tracking
  totalConversations  Int    @default(0)
  averageRating      Float?
  successRate        Float?
  
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  // Relations
  organization    Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  conversations   Conversation[]
  tools           AgentTool[]
  
  @@map("agents")
}

model AgentTool {
  id             String      @id @default(cuid())
  agentId        String
  integrationId String?                         // Source integration (null for built-in tools)
  toolName       String                         // Tool identifier (e.g., "searchProducts")
  displayName    String                         // Human-readable name
  description    String?                        // Tool description
  
  // Tool configuration
  schema         Json                           // Tool schema definition
  settings       Json        @default("{}")    // Tool-specific settings
  isEnabled      Boolean     @default(true)
  priority       Int         @default(0)       // Tool priority order
  
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  // Relations
  agent          Agent       @relation(fields: [agentId], references: [id], onDelete: Cascade)
  integration    Integration? @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  
  @@unique([agentId, toolName])
  @@index([agentId, isEnabled])
  @@map("agent_tools")
}

// =====================================
// CONVERSATIONS & MESSAGING
// =====================================

model Conversation {
  id              String              @id @default(cuid())
  organizationId  String
  customerId      String?             // External customer ID
  customerEmail   String?
  customerName    String?
  customerPhone   String?
  customerMeta    Json?               // Additional customer metadata
  
  // Conversation details
  status          ConversationStatus  @default(open)
  priority        Int                 @default(0)
  subject         String?
  channel         ChannelType
  channelMeta     Json?               // Channel-specific metadata
  
  // Agent assignment
  assignedAgentId String?
  assignedUserId  String?             // Human agent if escalated
  
  // Tracking
  startedAt       DateTime            @default(now())
  lastMessageAt   DateTime            @default(now())
  resolvedAt      DateTime?
  closedAt        DateTime?
  
  // Analytics
  messageCount    Int                 @default(0)
  averageResponseTime Float?          // In seconds
  customerSatisfaction Int?           // 1-5 rating
  tags            String[]            @default([])
  
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  // Relations
  organization    Organization        @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  assignedAgent   Agent?              @relation(fields: [assignedAgentId], references: [id])
  assignedUser    User?               @relation(fields: [assignedUserId], references: [id])
  messages        Message[]
  
  @@index([organizationId, status])
  @@index([organizationId, channel])
  @@index([customerId])
  @@map("conversations")
}

model Message {
  id              String      @id @default(cuid())
  conversationId  String
  senderId        String?     // User ID if sent by human
  senderType      String      // 'customer', 'agent', 'ai', 'system'
  
  // Message content
  type            MessageType @default(text)
  content         String
  metadata        Json?       // Message-specific metadata
  attachments     Json?       // File attachments
  
  // AI specific
  aiModel         String?     // AI model used (if AI-generated)
  tokensUsed      Int?        // Tokens consumed
  processingTime  Int?        // Processing time in milliseconds
  confidence      Float?      // AI confidence score
  toolsUsed       String[]    @default([])  // Tools used in response
  
  // Status
  isDelivered     Boolean     @default(false)
  isRead          Boolean     @default(false)
  deliveredAt     DateTime?
  readAt          DateTime?
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender          User?        @relation(fields: [senderId], references: [id])
  
  @@index([conversationId, createdAt])
  @@map("messages")
}

// =====================================
// CHANNELS & COMMUNICATION
// =====================================

model Channel {
  id              String      @id @default(cuid())
  organizationId  String
  type            ChannelType
  name            String                      // "Website Widget", "SMS Support"
  
  // Configuration
  isActive        Boolean     @default(true)
  settings        Json        @default("{}")  // Channel-specific settings
  
  // Integration details
  integrationId   String?                     // Related integration ID
  webhookUrl      String?                     // Webhook endpoint
  apiCredentials  Json?                       // Encrypted API credentials
  
  // Widget appearance (for web widget)
  widgetConfig    Json?                       // Widget styling and behavior
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([organizationId, type, name])
  @@map("channels")
}

// =====================================
// KNOWLEDGE BASE
// =====================================

model KnowledgeBaseItem {
  id              String      @id @default(cuid())
  organizationId  String
  title           String
  content         String
  contentType     ContentType
  category        String?
  tags            String[]    @default([])
  
  // Metadata
  language        String      @default("en")
  version         Int         @default(1)
  isPublished     Boolean     @default(false)
  
  // SEO
  slug            String?
  metaDescription String?
  
  // File information (if applicable)
  fileUrl         String?
  fileName        String?
  fileSize        Int?
  mimeType        String?
  
  // AI processing
  embedding       Float[]?                    // Vector embedding for semantic search
  isIndexed       Boolean     @default(false)
  lastIndexedAt   DateTime?
  
  // Usage tracking
  viewCount       Int         @default(0)
  useCount        Int         @default(0)     // Times used in AI responses
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@index([organizationId, isPublished])
  @@index([organizationId, contentType])
  @@index([organizationId, isIndexed])
  @@map("knowledge_base_items")
}

// =====================================
// ANALYTICS & MONITORING
// =====================================

model Analytics {
  id              String      @id @default(cuid())
  organizationId  String
  date            DateTime    @db.Date
  
  // Conversation metrics
  totalConversations      Int @default(0)
  newConversations        Int @default(0)
  resolvedConversations   Int @default(0)
  averageResponseTime     Float?
  averageResolutionTime   Float?
  customerSatisfactionAvg Float?
  
  // Channel breakdown
  webWidgetConversations  Int @default(0)
  smsConversations       Int @default(0)
  emailConversations     Int @default(0)
  voiceConversations     Int @default(0)
  socialConversations    Int @default(0)
  
  // AI metrics
  aiResponsesGenerated   Int @default(0)
  aiTokensUsed          Int @default(0)
  aiAverageConfidence   Float?
  escalationRate        Float?
  
  // Integration usage
  integrationApiCalls   Json?               // Per-integration API usage
  integrationErrors     Json?               // Per-integration error rates
  
  // Agent performance
  agentMetrics          Json?               // Per-agent statistics
  
  createdAt             DateTime @default(now())
  
  // Relations
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([organizationId, date])
  @@map("analytics")
}

// =====================================
// BILLING & USAGE TRACKING
// =====================================

model BillingUsage {
  id              String          @id @default(cuid())
  organizationId  String
  costType        SystemCostType
  quantity        Float                           // Usage amount
  unitCost        Float                           // Cost per unit
  totalCost       Float                           // Total cost for this usage
  
  // Context
  source          String?                         // Integration or service that generated cost
  metadata        Json?                           // Additional usage details
  billingPeriod   String                         // "2024-01", "2024-02"
  recordedAt      DateTime        @default(now())
  
  // Relations
  organization    Organization    @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@index([organizationId, billingPeriod])
  @@index([organizationId, costType])
  @@map("billing_usage")
}

// =====================================
// SYSTEM MONITORING
// =====================================

model SystemEvent {
  id              String      @id @default(cuid())
  organizationId  String?     // Null for system-wide events
  eventType       String      // 'error', 'warning', 'info', 'integration_status'
  source          String      // 'integration', 'ai_agent', 'api', 'widget'
  message         String
  details         Json?
  severity        Int         @default(0)     // 0=info, 1=warning, 2=error, 3=critical
  
  // Context
  userId          String?
  conversationId  String?
  agentId         String?
  integrationId   String?
  
  // Resolution
  isResolved      Boolean     @default(false)
  resolvedAt      DateTime?
  resolvedBy      String?
  
  createdAt       DateTime    @default(now())
  
  @@index([organizationId, eventType])
  @@index([organizationId, createdAt])
  @@index([organizationId, isResolved])
  @@map("system_events")
}
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install prisma @prisma/client
npm install -D prisma
```

### 2. Initialize Prisma

```bash
npx prisma init
```

### 3. Configure Environment

```env
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/ai_customer_service?schema=public"
```

### 4. Generate and Deploy

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name init
```

## 📋 Key Design Updates

### Modular Integration System
- **Generic Integration model** - Supports all integration types (Shopify, Stripe, MCP, etc.)
- **Encrypted credentials** - Secure storage of API keys and sensitive data
- **Status tracking** - Real-time monitoring of integration health
- **Universal configuration** - Flexible JSON-based settings per integration

### Universal Agent Configuration
- **Dynamic tool loading** - Tools are created based on integration configurations
- **Agent configuration JSON** - Matches our `/api/agents/chat` endpoint format
- **Integration-aware tools** - Tools are linked to their source integrations
- **Flexible routing** - Keyword-based agent selection

### Enhanced Analytics
- **Integration-specific metrics** - Track API usage and errors per integration
- **Tool usage tracking** - Monitor which tools are used in conversations
- **Performance optimization** - Separate analytics table for efficient queries

### Security & Scalability
- **Encrypted sensitive data** - All credentials and API keys are encrypted
- **Proper indexing** - Optimized for common query patterns
- **Audit trails** - Complete system event logging with resolution tracking
- **Multi-tenant isolation** - Organization-based data separation

## 🔍 Common Query Examples

### Get Organization with Integrations
```typescript
const org = await prisma.organization.findUnique({
  where: { id: orgId },
  include: {
    integrations: {
      where: { status: 'active' },
      select: { id: true, type: true, name: true, capabilities: true }
    },
    agents: {
      include: { tools: true }
    }
  }
});
```

### Create Shopify Integration
```typescript
const shopifyIntegration = await prisma.integration.create({
  data: {
    organizationId,
    type: 'shopify',
    name: 'Main Store',
    credentials: {
      storeDomain: encrypt(storeDomain),
      accessToken: encrypt(accessToken)
    },
    settings: {
      syncProducts: true,
      syncOrders: true
    },
    status: 'active'
  }
});
```

### Get Agent Configuration for Chat API
```typescript
const agent = await prisma.agent.findUnique({
  where: { id: agentId },
  include: {
    tools: {
      where: { isEnabled: true },
      include: { integration: true },
      orderBy: { priority: 'asc' }
    }
  }
});
```

### Track AI Usage
```typescript
await prisma.billingUsage.create({
  data: {
    organizationId,
    costType: 'ai_tokens_input',
    quantity: tokensUsed,
    unitCost: 0.001,
    totalCost: tokensUsed * 0.001,
    source: 'openai_gpt4o',
    billingPeriod: format(new Date(), 'yyyy-MM')
  }
});
```

This updated schema aligns perfectly with our modular integration architecture and universal agent configuration system! 