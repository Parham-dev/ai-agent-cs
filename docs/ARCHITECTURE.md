# AI Customer Service Platform - Architecture Overview

## System Architecture

```mermaid
graph TB
    %% User Layer
    subgraph "👥 User Interface Layer"
        Dashboard[Web Dashboard<br/>Next.js 15 + React 19]
        Widget[Embeddable Widget<br/>Cross-domain JWT Auth]
        Mobile[Mobile Responsive<br/>Tailwind + Mantine]
    end

    %% API Layer
    subgraph "🚪 API Gateway"
        API[Next.js API Routes v2<br/>RESTful Endpoints]
        Auth[Supabase Auth<br/>JWT + Session Management]
        MW[Custom Middleware<br/>CORS + Domain Validation]
    end

    %% Core AI Layer
    subgraph "🧠 AI Agent Engine"
        AgentRuntime[OpenAI Agents SDK<br/>@openai/agents]
        AssistantUI[Assistant-UI Runtime<br/>Message Management]
        MCPClient[MCP Client<br/>Tool Orchestration]
    end

    %% MCP Integration Layer
    subgraph "🔧 MCP Server Ecosystem"
        ShopifyMCP[Shopify MCP Server<br/>12 E-commerce Tools]
        StripeMCP[Stripe MCP Server<br/>Payment Processing]
        CustomMCP[Custom MCP Server<br/>Business Logic Tools]
    end

    %% Business Logic
    subgraph "⚙️ Application Services"
        AgentMgmt[Agent Management<br/>CRUD + Configuration]
        IntegrationMgmt[Integration Manager<br/>MCP Server Registry]
        GuardrailEngine[Guardrails System<br/>Safety + Quality]
    end

    %% Data Layer
    subgraph "💾 Data Persistence"
        Supabase[(Supabase PostgreSQL<br/>Primary Database + Auth)]
        PGVector[(pgvector Extension<br/>AI Memory + Knowledge)]
        FileStorage[(Supabase Storage<br/>File Management)]
    end

    %% External Services
    subgraph "🔌 External APIs"
        OpenAI[OpenAI API<br/>Multiple Model Support]
        ShopifyAPI[Shopify Admin API<br/>E-commerce Integration]
        StripeAPI[Stripe API<br/>Payment Processing]
    end

    %% Connections
    Dashboard --> API
    Widget --> API
    Mobile --> API
    
    API --> Auth
    API --> MW
    API --> AgentMgmt
    API --> IntegrationMgmt
    API --> GuardrailEngine
    
    AgentMgmt --> AgentRuntime
    AgentRuntime --> AssistantUI
    AgentRuntime --> MCPClient
    
    MCPClient --> ShopifyMCP
    MCPClient --> StripeMCP
    MCPClient --> CustomMCP
    
    ShopifyMCP --> ShopifyAPI
    StripeMCP --> StripeAPI
    AgentRuntime --> OpenAI
    
    AgentMgmt --> Supabase
    IntegrationMgmt --> Supabase
    AssistantUI --> PGVector
    Auth --> Supabase
    
    %% Styling
    classDef userLayer fill:#e1f5fe
    classDef apiLayer fill:#f3e5f5
    classDef aiLayer fill:#e8f5e8
    classDef mcpLayer fill:#fff3e0
    classDef businessLayer fill:#fce4ec
    classDef dataLayer fill:#f1f8e9
    classDef externalLayer fill:#ffebee
    
    class Dashboard,Widget,Mobile userLayer
    class API,Auth,MW apiLayer
    class AgentRuntime,AssistantUI,MCPClient aiLayer
    class ShopifyMCP,StripeMCP,CustomMCP mcpLayer
    class AgentMgmt,IntegrationMgmt,GuardrailEngine businessLayer
    class Supabase,PGVector,FileStorage dataLayer
    class OpenAI,ShopifyAPI,StripeAPI externalLayer
```

## Technology Stack

```mermaid
graph LR
    subgraph "🎨 Frontend Stack"
        NextJS[Next.js 15]
        React[React 19]
        TypeScript[TypeScript]
        Mantine[Mantine UI 8]
        Tailwind[Tailwind CSS]
        AssistantUI[Assistant-UI React]
    end

    subgraph "⚡ Backend Stack"
        NextAPI[Next.js API Routes v2]
        OpenAIAgents[OpenAI Agents SDK]
        MCPFramework[MCP Framework]
        Prisma[Prisma ORM]
        Middleware[Custom Middleware]
    end

    subgraph "🗄️ Database Stack"
        SupabaseDB[(Supabase PostgreSQL)]
        Vector[(pgvector Extension)]
        Auth[(Supabase Auth)]
        RLS[(Row Level Security)]
    end

    subgraph "🤖 AI & Integration Stack"
        OpenAI[OpenAI Multiple Models]
        MCP[Model Context Protocol]
        Shopify[Shopify MCP Server]
        Stripe[Stripe MCP Server]
        CustomMCP[Custom MCP Server]
        Guardrails[Custom Guardrails]
    end

    NextJS --> NextAPI
    NextAPI --> OpenAIAgents
    OpenAIAgents --> OpenAI
    NextAPI --> MCPFramework
    MCPFramework --> MCP
    MCP --> Shopify
    MCP --> Stripe
    MCP --> CustomMCP
    NextAPI --> Prisma
    Prisma --> SupabaseDB
    SupabaseDB --> Vector
    SupabaseDB --> Auth
    Auth --> RLS
```

### Detailed Technology Breakdown

#### Frontend Framework
- **Next.js 15**: React-based full-stack framework with App Router and Server Components
- **React 19**: Latest React with concurrent features and streaming SSR
- **TypeScript**: Full type safety across frontend and backend

#### UI/UX Libraries  
- **Mantine UI 8**: Modern React component library with dark/light theme support
- **Tailwind CSS**: Utility-first CSS framework for custom styling
- **Assistant-UI React**: Specialized chat interface components optimized for AI conversations

#### AI Agent Runtime
- **OpenAI Agents SDK**: Official agent runtime using `@openai/agents` package
- **Model Context Protocol (MCP)**: Standardized tool integration framework
- **Custom MCP Servers**: Shopify, Stripe, and business-specific tool implementations

#### Database & Storage
- **Supabase PostgreSQL**: Managed PostgreSQL with built-in authentication
- **pgvector Extension**: Vector storage for AI embeddings and semantic search
- **Row Level Security**: Database-level access controls and multi-tenancy

#### API & Backend
- **Next.js API Routes v2**: Modern RESTful API endpoints in `/app/api/v2/`
- **Streaming Responses**: Real-time message delivery for chat interfaces
- **Custom Middleware**: Authentication, rate limiting, and security layers

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User as User
    participant Dashboard as Dashboard
    participant API as API Routes v2
    participant Agent as OpenAI Agents SDK
    participant MCP as MCP Client
    participant Shopify as Shopify MCP Server
    participant DB as Supabase DB
    participant OpenAI as OpenAI API

    User->>Dashboard: Access Agent Chat
    Dashboard->>API: GET /api/v2/agents/{id}
    API->>DB: Fetch Agent Config
    DB-->>API: Agent Settings + MCP Config
    API-->>Dashboard: Agent Data
    
    User->>Dashboard: Send Message
    Dashboard->>API: POST /api/v2/agents/chat
    API->>DB: Store User Message
    API->>Agent: Process with Agent Runtime
    
    Agent->>MCP: Request Tool Execution
    MCP->>Shopify: Execute Business Tool
    Shopify-->>MCP: Tool Result
    MCP-->>Agent: Processed Result
    
    Agent->>OpenAI: Generate AI Response
    OpenAI-->>Agent: AI Response
    Agent->>DB: Store AI Response + Metadata
    Agent-->>API: Response Data
    API-->>Dashboard: Stream Response
    Dashboard-->>User: Display Message
```

## Application Structure

```mermaid
graph TD
    subgraph "📱 App Directory Structure"
        App[app/]
        AppRoutes[API Routes v2]
        Pages[Page Components]
        Layout[Layout Components]
    end

    subgraph "🧩 Components Layer"
        Dashboard[Dashboard Components]
        Agents[Agent Management]
        Chat[Chat Interface]
        Widget[Widget Components]
    end

    subgraph "� Library Layer"
        AgentLib[lib/agents/]
        MCPLib[lib/mcp/]
        AuthLib[lib/auth/]
        GuardrailLib[lib/guardrails/]
        TypesLib[lib/types/]
    end

    subgraph "🔧 MCP Ecosystem"
        MCPClient[MCP Client]
        ShopifyServer[Shopify MCP Server]
        StripeServer[Stripe MCP Server]
        CustomServer[Custom Tools MCP Server]
    end

    subgraph "�️ Database Schema"
        UserModel[User Model]
        AgentModel[Agent Model]
        ConversationModel[Conversation Model]
        IntegrationModel[Integration Model]
    end

    App --> AppRoutes
    App --> Pages
    App --> Layout
    
    Pages --> Dashboard
    Pages --> Agents
    Pages --> Chat
    Pages --> Widget
    
    Dashboard --> AgentLib
    Chat --> MCPLib
    Widget --> AuthLib
    Agents --> GuardrailLib
    
    MCPLib --> MCPClient
    MCPClient --> ShopifyServer
    MCPClient --> StripeServer
    MCPClient --> CustomServer
    
    AgentLib --> UserModel
    AgentLib --> AgentModel
    Chat --> ConversationModel
    MCPLib --> IntegrationModel
```

## Component Architecture

```mermaid
graph TD
    subgraph "🎯 Dashboard Layout"
        DashboardLayout[components/dashboard/layout.tsx]
        Header[components/dashboard/header.tsx]
        Sidebar[components/dashboard/sidebar.tsx]
        Footer[components/dashboard/footer.tsx]
    end

    subgraph "🤖 Agent Components"
        AgentCard[components/agents/creation/agent-card.tsx]
        AgentForm[components/agents/creation/agent-form.tsx]
        AgentIntegrations[components/agent-integrations/]
        AgentManager[components/agent-integrations/agent-integrations-manager.tsx]
    end

    subgraph "� Chat Interface"
        ThreadSidebar[components/assistant-ui/thread-list-sidebar.tsx]
        ChatThread[components/assistant-ui/chat-thread.tsx]
        ThreadComponent[components/assistant-ui/thread.tsx]
        MarkdownText[components/assistant-ui/markdown-text.tsx]
    end

    subgraph "🔧 Core Libraries"
        AgentFactory[lib/agents/agent-factory.ts]
        MCPClient[lib/mcp/client.ts]
        AuthProvider[lib/auth/index.ts]
        RuntimeAdapter[lib/assistant-ui/runtime.ts]
    end

    subgraph "🌐 Widget System"
        WidgetDemo[components/widget/demo/]
        WidgetPublic[public/widget/]
        WidgetPage[app/widget/demo/page.tsx]
    end

    DashboardLayout --> Header
    DashboardLayout --> Sidebar
    DashboardLayout --> Footer
    
    Sidebar --> AgentCard
    AgentCard --> AgentForm
    AgentForm --> AgentIntegrations
    AgentIntegrations --> AgentManager
    
    DashboardLayout --> ThreadSidebar
    DashboardLayout --> ChatThread
    ChatThread --> ThreadComponent
    ThreadComponent --> MarkdownText
    
    AgentCard --> AgentFactory
    ChatThread --> MCPClient
    DashboardLayout --> AuthProvider
    ChatThread --> RuntimeAdapter
    
    WidgetDemo --> WidgetPublic
    WidgetPublic --> WidgetPage
```

## Security Architecture

```mermaid
graph TB
    subgraph "� Authentication Layer"
        Auth[Supabase Auth]
        Session[lib/session/]
        AuthProvider[components/providers/auth-provider.tsx]
        ProtectedRoute[components/auth/protected-route.tsx]
    end

    subgraph "🛡️ Guardrails System"
        GuardCore[lib/guardrails/]
        SecurityLib[lib/security/]
        ValidationLayer[Input Validation]
        OutputFilter[Response Filtering]
    end

    subgraph "🔑 API Security"
        Middleware[middleware.ts]
        APIRoutes[app/api/v2/]
        RateLimit[Rate Limiting]
        CORS[CORS Headers]
    end

    subgraph "🏰 Data Protection"
        SupabaseRLS[Row Level Security]
        EncryptedStorage[Encrypted Session Storage]
        VectorSecurity[pgvector Access Control]
        BackupSecurity[Automated Backups]
    end

    Auth --> Session
    Session --> AuthProvider
    AuthProvider --> ProtectedRoute
    
    GuardCore --> SecurityLib
    SecurityLib --> ValidationLayer
    ValidationLayer --> OutputFilter
    
    Middleware --> APIRoutes
    APIRoutes --> RateLimit
    RateLimit --> CORS
    
    Auth --> SupabaseRLS
    Session --> EncryptedStorage
    SupabaseRLS --> VectorSecurity
    VectorSecurity --> BackupSecurity
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "🌍 Production Environment"
        CDN[Vercel CDN]
        App[Next.js Application]
        DB[(Supabase PostgreSQL)]
    end

    subgraph "🔄 CI/CD Pipeline"
        GitHub[GitHub Repository]
        Actions[GitHub Actions]
        Deploy[Auto Deployment]
    end

    subgraph "📊 Monitoring"
        Vercel[Vercel Analytics]
        Logs[Application Logs]
        Health[Health Checks]
    end

    GitHub --> Actions
    Actions --> Deploy
    Deploy --> App
    App --> CDN
    App --> DB
    
    App --> Vercel
    App --> Logs
    App --> Health
```

## Key Features

### 🤖 AI-Powered Chat
- **Multi-Model Support**: OpenAI GPT-4, GPT-3.5-turbo
- **Context Awareness**: Conversation history and user context
- **Tool Integration**: Custom functions and database queries
- **Real-time Streaming**: Live response generation

### 👥 Agent Management
- **Dynamic Configuration**: Customizable AI personalities
- **Performance Monitoring**: Analytics and metrics
- **Multi-tenant Support**: Organization-based isolation
- **Version Control**: Agent configuration versioning

### 🔗 Integration Ecosystem
- **REST API**: Full programmatic access
- **Webhook Support**: Real-time event notifications
- **Embeddable Widget**: Easy website integration
- **Third-party Connectors**: CRM, helpdesk, and analytics tools

### 🛡️ Enterprise Security
- **Authentication**: Multi-factor authentication support
- **Authorization**: Role-based access control
- **Data Privacy**: GDPR and compliance ready
- **Audit Logging**: Complete activity tracking

---

*This architecture is designed for scalability, maintainability, and extensibility to support growing customer service operations.*
