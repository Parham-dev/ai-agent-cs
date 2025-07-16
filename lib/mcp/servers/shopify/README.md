# Shopify MCP Server

This directory contains the Shopify MCP (Model Context Protocol) server implementation, providing e-commerce tools and data access for AI agents.

## Overview

The Shopify MCP server enables AI agents to interact with Shopify stores through standardized tools. It migrates the existing Shopify integration from context-passing to a scalable MCP server architecture.

## Directory Structure

```
lib/mcp/servers/shopify/
├── README.md                     # This file
├── server.ts                     # Main MCP server implementation
├── client.ts                     # Shopify API client wrapper
├── types.ts                      # TypeScript interfaces
├── tools/                        # Individual tool implementations
│   ├── search-products.ts        # Product search functionality
│   ├── get-product-details.ts    # Product detail retrieval
│   ├── list-products.ts          # Product catalog listing
│   └── index.ts                  # Tool exports
└── utils/                        # Utility functions
    ├── validation.ts              # Input validation
    ├── formatting.ts              # Response formatting
    └── error-handling.ts          # Error management
```

## Key Files

### `server.ts`
- **Purpose**: Main MCP server implementation
- **Responsibilities**:
  - Implement MCP protocol handlers
  - Register available tools
  - Handle client connections
  - Manage server lifecycle
  - Process tool execution requests

### `client.ts`
- **Purpose**: Shopify API client wrapper
- **Responsibilities**:
  - Shopify API authentication
  - HTTP request handling
  - Rate limiting and retry logic
  - Error handling and logging

### `tools/`
- **Purpose**: Individual tool implementations
- **Responsibilities**:
  - Tool-specific business logic
  - Input validation and sanitization
  - API calls and data processing
  - Response formatting

## Available Tools

### 1. `searchProducts`
- **Purpose**: Search for products by various criteria
- **Parameters**:
  - `query` (string): Search query for title, vendor, type, or tags
  - `limit` (number): Maximum results to return (1-50)
- **Returns**: Array of product summaries with key information

### 2. `getProductDetails`
- **Purpose**: Retrieve detailed information for a specific product
- **Parameters**:
  - `productId` (string): Unique Shopify product ID
- **Returns**: Comprehensive product data including variants, images, options

### 3. `listProducts`
- **Purpose**: List products with optional filtering
- **Parameters**:
  - `limit` (number): Maximum products to return (1-250)
  - `status` (enum): Filter by product status (active, draft, archived)
- **Returns**: Paginated product catalog

## Server Configuration

### Command Line Execution
The server runs as a stdio MCP server:
```bash
node lib/mcp/servers/shopify/server.js --credentials <encrypted_credentials>
```

### Environment Variables
- `SHOPIFY_TIMEOUT` - API request timeout (default: 30000ms)
- `SHOPIFY_RETRY_COUNT` - Number of retry attempts (default: 3)
- `SHOPIFY_RATE_LIMIT` - Rate limiting configuration
- `LOG_LEVEL` - Logging verbosity (debug, info, warn, error)

## Integration Migration

### From Legacy Implementation
The migration process moves from the existing implementation:
- **From**: `lib/integrations/shopify/tools.ts`
- **To**: `lib/mcp/servers/shopify/`

### Key Changes
1. **Protocol**: JSON-RPC over stdio instead of direct function calls
2. **Isolation**: Separate process with own memory space
3. **Discovery**: Dynamic tool discovery via MCP protocol
4. **Lifecycle**: Independent server lifecycle management

### Compatibility
- Tool names and parameters remain unchanged
- Response formats are preserved
- Error handling maintains consistency
- Logging follows existing patterns

## Tool Implementation Pattern

Each tool follows a consistent pattern:

```typescript
import { Tool } from '@modelcontextprotocol/server-everything';

export const searchProducts: Tool = {
  name: 'searchProducts',
  description: 'Search for products by title, vendor, type, or tags',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      limit: { type: 'number', minimum: 1, maximum: 50, default: 10 }
    },
    required: ['query']
  },
  
  async handler(params: SearchProductsParams, context: ToolContext) {
    // Implementation here
  }
};
```

## Security Considerations

### Credential Management
- Encrypted credentials passed at server startup
- No credential storage in server code
- Secure credential injection from environment
- Credential rotation support

### Input Validation
- Strict parameter validation using JSON schemas
- Sanitization of search queries
- Rate limiting for API calls
- Protection against injection attacks

### Error Handling
- Sanitized error messages (no credential leakage)
- Structured error responses
- Comprehensive logging for debugging
- Graceful degradation on failures

## Performance Optimization

### Caching
- Tool list caching for faster discovery
- Response caching for frequently accessed data
- Connection pooling for Shopify API
- Memory management for large datasets

### Rate Limiting
- Built-in rate limiting for Shopify API
- Configurable request throttling
- Backoff strategies for API limits
- Queue management for high-volume requests

## Testing

### Unit Tests
- Individual tool function testing
- Input validation testing
- Error handling scenarios
- Mock Shopify API responses

### Integration Tests
- MCP protocol communication
- Server lifecycle management
- Tool discovery and execution
- End-to-end workflow testing

## Monitoring and Debugging

### Logging
- Structured logging for all operations
- Request/response logging
- Error tracking and reporting
- Performance metrics

### Health Checks
- Server availability monitoring
- Shopify API connectivity checks
- Tool execution monitoring
- Performance metrics collection

## Development Guidelines

### Adding New Tools
1. Create tool implementation in `tools/`
2. Add tool registration in `server.ts`
3. Update type definitions
4. Add comprehensive tests
5. Update documentation

### Error Handling
- Use structured error responses
- Implement proper error logging
- Provide user-friendly error messages
- Handle network and API failures gracefully

### Code Quality
- Follow TypeScript best practices
- Implement proper input validation
- Use consistent code formatting
- Add comprehensive documentation