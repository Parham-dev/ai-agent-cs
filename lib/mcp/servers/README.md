# MCP Servers

This directory contains individual MCP (Model Context Protocol) servers for different integrations and tool categories.

## Overview

Each subdirectory represents a separate MCP server that provides tools for specific integrations or functionalities. These servers run as separate processes and communicate with the main application through the MCP protocol.

## Directory Structure

```
lib/mcp/servers/
├── README.md                     # This file
├── shopify/                      # Shopify e-commerce integration
│   ├── README.md                 # Shopify server documentation
│   ├── server.ts                 # Main server implementation
│   ├── tools/                    # Individual tool implementations
│   │   ├── search-products.ts    # Product search functionality
│   │   ├── get-product-details.ts # Product detail retrieval
│   │   └── list-products.ts      # Product catalog listing
│   └── types.ts                  # TypeScript interfaces
├── stripe/                       # Stripe payment integration
│   ├── README.md                 # Stripe server documentation
│   ├── server.ts                 # Payment processing server
│   └── tools/                    # Payment-related tools
└── custom/                       # Custom business logic tools
    ├── README.md                 # Custom tools documentation
    ├── server.ts                 # Custom tools server
    └── tools/                    # Custom tool implementations
```

## Server Implementation Pattern

Each MCP server follows a consistent pattern:

### 1. Server Entry Point (`server.ts`)
- Implements MCP server protocol
- Registers available tools
- Handles client connections
- Manages server lifecycle

### 2. Tool Implementation (`tools/`)
- Individual tool functions
- Input validation and sanitization
- Error handling and logging
- Integration-specific business logic

### 3. Type Definitions (`types.ts`)
- TypeScript interfaces for tools
- Parameter and response schemas
- Integration-specific data models

## Server Communication

### Stdio Protocol
Servers communicate through standard input/output:
- **Input**: JSON-RPC messages from MCP client
- **Output**: JSON-RPC responses with tool results
- **Error Handling**: Structured error messages

### Tool Discovery
- Each server exposes available tools through `list_tools()`
- Tools are dynamically discovered by the MCP client
- Tool schemas define parameters and expected responses

## Development Guidelines

### Adding New Servers
1. Create new directory under `servers/`
2. Implement `server.ts` with MCP protocol
3. Add tool implementations in `tools/` directory
4. Create comprehensive README documentation
5. Add server configuration to `config/servers.ts`

### Tool Development
1. Follow consistent naming conventions
2. Implement proper input validation
3. Add comprehensive error handling
4. Include logging for debugging
5. Write unit tests for tool functions

### Security Considerations
- Validate all inputs before processing
- Sanitize outputs to prevent data leakage
- Implement proper authentication/authorization
- Use secure credential management
- Log security-relevant events

## Performance Optimization

- **Connection Pooling**: Reuse server connections
- **Caching**: Cache tool results where appropriate
- **Lazy Loading**: Start servers only when needed
- **Resource Management**: Clean up resources properly

## Monitoring and Debugging

- **Logging**: Structured logging for all server operations
- **Metrics**: Track tool usage and performance
- **Health Checks**: Server availability monitoring
- **Error Tracking**: Comprehensive error reporting

## Testing

- **Unit Tests**: Test individual tool functions
- **Integration Tests**: Test server communication
- **End-to-End Tests**: Test full agent workflows
- **Load Tests**: Verify server performance under load