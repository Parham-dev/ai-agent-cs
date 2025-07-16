# MCP (Model Context Protocol) Integration

This directory contains the MCP infrastructure for the AI Customer Service platform, enabling scalable tool management through the Model Context Protocol.

## Overview

The MCP integration allows our AI agents to connect to external tools and data sources through standardized protocols, moving away from context-passing to a more scalable server-based architecture.

## Directory Structure

```
lib/mcp/
├── README.md                     # This file
├── client.ts                     # MCP client configuration and management
├── config/                       # MCP server configurations
│   ├── README.md                 # Configuration documentation
│   └── servers.ts                # Server registry and configuration
└── servers/                      # Individual MCP servers
    ├── README.md                 # Server documentation
    ├── shopify/                  # Shopify integration MCP server
    ├── stripe/                   # Stripe integration MCP server
    └── custom/                   # Custom tools MCP server
```

## Key Files

### `client.ts`
- **Purpose**: MCP client initialization and connection management
- **Responsibilities**: 
  - Configure MCP servers based on agent integrations
  - Handle server lifecycle (connect/disconnect)
  - Manage server connection pooling
  - Provide error handling and fallback mechanisms

### `config/servers.ts`
- **Purpose**: Central registry for all MCP servers
- **Responsibilities**:
  - Define server configurations
  - Map integration types to MCP servers
  - Manage server startup commands and parameters
  - Handle server discovery and registration

## Usage

```typescript
import { createMCPClient } from '@/lib/mcp/client';

// Initialize MCP client with agent integrations
const mcpClient = await createMCPClient(agent.integrations);

// Create agent with MCP servers
const agent = new Agent({
  name: agent.name,
  instructions: agent.instructions,
  mcpServers: mcpClient.servers,
});
```

## Benefits

- **Scalability**: Tools run as separate processes, no context limits
- **Maintainability**: Each integration is a standalone MCP server
- **Performance**: Only active tools consume resources
- **Security**: Process isolation and credential management
- **Interoperability**: Standard MCP protocol works with any AI model

## Migration Strategy

1. **Phase 1**: Convert existing Shopify integration to MCP server
2. **Phase 2**: Add new integrations as MCP servers
3. **Phase 3**: Migrate OpenAI hosted tools to MCP (optional)
4. **Phase 4**: Remove legacy context-passing code

## Dependencies

- `@openai/agents` - OpenAI Agents SDK with MCP support
- `@modelcontextprotocol/server-everything` - MCP server utilities
- Individual integration dependencies (shopify-api, stripe, etc.)