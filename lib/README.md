# 📚 Core Business Logic

The `lib/` directory contains all core business logic, separated from UI and API routes for maximum reusability and testability.

## 📁 Structure

### `/agents` - Agent Orchestration
- **`factory.ts`** - Agent creation factory with dynamic tool composition
- **`registry.ts`** - Central tool registry and capability management  
- **`types.ts`** - Agent type definitions and interfaces

### `/integrations` - Integration Providers
- **`base.ts`** - Base integration interface and common patterns
- **`shopify/`** - Shopify e-commerce integration
  - `client.ts` - Shopify API client (<200 lines)
  - `tools.ts` - Shopify-specific agent tools (<300 lines)
  - `validator.ts` - Credential validation (<100 lines)
  - `types.ts` - Shopify type definitions (<100 lines)
- **`stripe/`** - Payment processing integration (future)

### `/tools` - Universal Tools
- **`openai/`** - OpenAI hosted tools (web search, code interpreter, etc.)
- **`mcp/`** - Model Context Protocol server integrations
- **`custom/`** - Custom business logic tools (knowledge base, escalation)

### `/database` - Data Persistence
- **`schema.ts`** - Database schema definitions
- **`agent-config.ts`** - Agent configuration storage
- **`user-sessions.ts`** - User session management
- **`analytics.ts`** - Usage analytics and reporting

### `/auth` - Authentication
- **`business-owner.ts`** - Business owner authentication logic
- **`widget.ts`** - Widget user authentication

### `/utils` - Shared Utilities
- **`validation.ts`** - Input validation helpers
- **`encryption.ts`** - Credential encryption/decryption
- **`rate-limiting.ts`** - Rate limiting logic
- **`error-handling.ts`** - Centralized error handling

## 🎯 Design Principles

- **Single Responsibility**: Each file has one clear purpose
- **Under 400 lines**: Keep files focused and maintainable  
- **Type Safety**: Strong TypeScript interfaces throughout
- **Testable**: Pure functions with clear inputs/outputs 