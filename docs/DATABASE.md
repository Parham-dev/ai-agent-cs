# 🗄️ Database Schema - AI Customer Service Platform

This document outlines the complete database schema for the AI Customer Service Platform using Prisma ORM and PostgreSQL.

## 📊 Schema Overview

The database is designed to support:
- Multi-tenant organizations
- AI agent orchestration
- MCP platform integrations
- Omnichannel communications
- Knowledge management
- Analytics and billing
- Real-time conversations

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

// Platform types for MCP integration
enum PlatformType {
  shopify         // Shopify e-commerce
  woocommerce     // WooCommerce
  magento         // Magento
  bigcommerce     // BigCommerce
  squarespace     // Squarespace
  wordpress       // WordPress
  custom          // Custom platform
  api             // Generic API
}

// MCP transport methods
enum MCPTransport {
  sse             // Server-Sent Events
  stdio           // Standard I/O
  websocket       // WebSocket connection
  http            // HTTP REST
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
  mcp_api_calls     // MCP API calls
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
  
  // Platform integration
  platformType         PlatformType?
  platformUrl          String?
  platformDetectedAt   DateTime?
  
  // Settings
  settings        Json      @default("{}")        // Flexible settings storage
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  users           OrganizationUser[]
  conversations   Conversation[]
  agents          Agent[]
  mcpIntegrations MCPIntegration[]
  knowledgeBase   KnowledgeBaseItem[]
  channels        Channel[]
  analytics       Analytics[]
  billing         BillingUsage[]
  configurations  Configuration[]
  
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
// CONFIGURATION MANAGEMENT
// =====================================

model ConfigurationCategory {
  id           String    @id                     // 'general', 'apiKeys', etc.
  name         String                            // 'General Settings'
  description  String?                           // Category description
  displayOrder Int       @default(0)             // UI display order
  isEnabled    Boolean   @default(true)          // Whether category is active
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  // Relations
  configurations Configuration[]
  
  @@map("configuration_categories")
}

model Configuration {
  id                    String    @id @default(cuid())
  organizationId        String
  categoryId            String
  key                   String                  // 'openai_api_key', 'default_language'
  value                 String?                 // Encrypted if sensitive
  defaultValue          String?                 // Default fallback value
  dataType              String    @default("string") // string, number, boolean, json
  isEncrypted          Boolean   @default(false) // Whether value is encrypted
  isSensitive          Boolean   @default(false) // Whether to hide in UI
  isRequired           Boolean   @default(false) // Whether required for operation
  description          String?                 // Human-readable description
  validationRules      Json?                   // Validation constraints
  displayOrder         Int       @default(0)   // UI display order
  isEnabled            Boolean   @default(true) // Whether config is active
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  // Relations
  organization         Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  category            ConfigurationCategory @relation(fields: [categoryId], references: [id])
  
  @@unique([organizationId, categoryId, key])
  @@map("configurations")
}

// =====================================
// AI AGENTS & MCP INTEGRATION
// =====================================

model Agent {
  id              String     @id @default(cuid())
  organizationId  String
  name            String                        // "Support Agent", "Sales Agent"
  type            AgentType
  description     String?
  instructions    String                        // AI instructions/prompt
  model           String     @default("gpt-4")  // AI model to use
  temperature     Float      @default(0.7)     // AI temperature setting
  maxTokens       Int        @default(2000)    // Max response tokens
  
  // Agent configuration
  isActive        Boolean    @default(true)
  priority        Int        @default(0)       // Agent priority for routing
  triggerKeywords String[]   @default([])      // Keywords that trigger this agent
  settings        Json       @default("{}")    // Additional settings
  
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
  id          String    @id @default(cuid())
  agentId     String
  name        String                          // Tool identifier
  description String?                         // Tool description
  schema      Json                           // Tool schema definition
  isEnabled   Boolean   @default(true)
  createdAt   DateTime  @default(now())
  
  // Relations
  agent       Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  
  @@unique([agentId, name])
  @@map("agent_tools")
}

model MCPIntegration {
  id              String      @id @default(cuid())
  organizationId  String
  name            String                        // "Shopify Store", "Custom API"
  platformType    PlatformType
  transport       MCPTransport
  
  // Connection details
  endpoint        String?                       // MCP server endpoint
  serverCommand   String?                       // Command to start MCP server
  authConfig      Json?                         // Authentication configuration
  connectionConfig Json       @default("{}")   // Additional connection settings
  
  // Status
  isActive        Boolean     @default(true)
  isConnected     Boolean     @default(false)
  lastConnectedAt DateTime?
  lastError       String?
  
  // Metadata
  version         String?                       // MCP server version
  capabilities    String[]    @default([])     // Available capabilities
  tools           Json        @default("[]")   // Available tools
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@map("mcp_integrations")
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
  integrationId   String?                     // External integration ID
  webhookUrl      String?                     // Webhook endpoint
  apiCredentials  Json?                       // Encrypted API credentials
  
  // Appearance (for widget)
  primaryColor    String?
  position        String?     @default("bottom-right")
  welcomeMessage  String?
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([organizationId, type])
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
  embedding       Float[]?                    // Vector embedding
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
  
  // Agent performance
  agentMetrics          Json? // Per-agent statistics
  
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
  
  // Metadata
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
  eventType       String      // 'error', 'warning', 'info'
  source          String      // 'mcp_integration', 'ai_agent', 'api'
  message         String
  details         Json?
  severity        Int         @default(0)     // 0=info, 1=warning, 2=error, 3=critical
  
  // Context
  userId          String?
  conversationId  String?
  agentId         String?
  
  createdAt       DateTime    @default(now())
  
  @@index([organizationId, eventType])
  @@index([organizationId, createdAt])
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

# Seed the database (optional)
npx prisma db seed
```

## 📋 Key Design Decisions

### Multi-Tenancy
- **Organization-based isolation** - Each organization has its own data
- **Flexible user roles** - Users can have different roles per organization
- **Configuration management** - Per-organization settings and API keys

### Scalability
- **Indexed fields** - Optimized queries for conversations, analytics
- **JSON fields** - Flexible metadata storage without schema changes
- **Separate analytics** - Daily aggregated metrics for performance

### AI Integration
- **Agent orchestration** - Multiple specialized AI agents per organization
- **Token tracking** - Monitor AI usage and costs
- **Tool management** - Dynamic tool assignment to agents

### MCP Integration
- **Platform detection** - Automatic identification of e-commerce platforms
- **Flexible transport** - Support for SSE, WebSocket, stdio, HTTP
- **Dynamic configuration** - Runtime MCP server management

### Security
- **Encrypted sensitive data** - API keys and credentials encrypted
- **Audit trails** - System events and user actions logged
- **Role-based access** - Granular permissions per user

## 🔍 Common Queries

### Get Organization Conversations
```typescript
const conversations = await prisma.conversation.findMany({
  where: { organizationId: orgId },
  include: {
    messages: { orderBy: { createdAt: 'asc' } },
    assignedAgent: true,
    assignedUser: true
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
    billingPeriod: '2024-01'
  }
});
```

### Get Agent Performance
```typescript
const agentStats = await prisma.agent.findUnique({
  where: { id: agentId },
  include: {
    conversations: {
      where: { status: 'resolved' },
      select: { customerSatisfaction: true }
    }
  }
});
```

This schema provides a solid foundation for your AI Customer Service Platform with room for growth and customization as your platform evolves! 