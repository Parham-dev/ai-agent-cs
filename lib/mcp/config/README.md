# MCP Configuration

This directory contains configuration files for MCP (Model Context Protocol) servers and client settings.

## Overview

The configuration system manages how MCP servers are discovered, initialized, and connected to agents. It provides a centralized registry for all available MCP servers and their startup configurations.

## Directory Structure

```
lib/mcp/config/
├── README.md                     # This file
├── servers.ts                    # Server registry and configuration
├── types.ts                      # Configuration type definitions
└── defaults.ts                   # Default configuration values
```

## Key Files

### `servers.ts`
- **Purpose**: Central registry for all MCP servers
- **Responsibilities**:
  - Map integration types to MCP server configurations
  - Define server startup commands and parameters
  - Handle server discovery and registration
  - Manage server-specific settings

### `types.ts`
- **Purpose**: TypeScript interfaces for configuration
- **Responsibilities**:
  - Define server configuration schemas
  - Integration mapping interfaces
  - Runtime configuration types

### `defaults.ts`
- **Purpose**: Default configuration values
- **Responsibilities**:
  - Fallback server configurations
  - Default timeout and retry settings
  - Standard server parameters

## Configuration Structure

### Server Configuration Schema

```typescript
interface MCPServerConfig {
  name: string;                    // Human-readable server name
  command: string;                 // Server executable command
  args?: string[];                 // Command-line arguments
  env?: Record<string, string>;    // Environment variables
  timeout?: number;                // Connection timeout (ms)
  retries?: number;                // Connection retry attempts
  cacheToolsList?: boolean;        // Cache tool discovery
  integrationTypes: string[];      // Supported integration types
}
```

### Integration Mapping

```typescript
interface IntegrationServerMap {
  [integrationType: string]: {
    serverName: string;            // Reference to server config
    requiredCredentials: string[]; // Required credential fields
    optionalSettings: string[];    // Optional configuration
  };
}
```

## Usage Examples

### Server Registration
```typescript
// Register a new MCP server
export const MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'Shopify MCP Server',
    command: 'node',
    args: ['./lib/mcp/servers/shopify/server.js'],
    timeout: 30000,
    cacheToolsList: true,
    integrationTypes: ['shopify']
  }
];
```

### Integration Mapping
```typescript
// Map integration types to servers
export const INTEGRATION_SERVER_MAP: IntegrationServerMap = {
  shopify: {
    serverName: 'Shopify MCP Server',
    requiredCredentials: ['shopDomain', 'accessToken'],
    optionalSettings: ['apiVersion', 'timeout']
  }
};
```

## Configuration Loading

### Runtime Configuration
The configuration system dynamically loads server configs based on:
- Agent's active integrations
- Available server implementations
- Runtime environment settings

### Environment Variables
Server configurations can be overridden via environment variables:
- `MCP_SERVER_TIMEOUT` - Default server timeout
- `MCP_CACHE_TOOLS` - Enable/disable tool caching
- `MCP_LOG_LEVEL` - Logging verbosity

## Server Lifecycle Management

### Server Discovery
1. Load server configurations from registry
2. Filter servers based on agent integrations
3. Validate required credentials are available
4. Initialize server connections

### Connection Management
- **Startup**: Servers are started on-demand
- **Health Checks**: Regular connection monitoring
- **Restart**: Automatic restart on failure
- **Shutdown**: Graceful server termination

## Security Configuration

### Credential Management
- Servers receive only necessary credentials
- Credentials are encrypted in transit
- No credential storage in configuration files
- Secure credential injection at runtime

### Access Control
- Server-specific permission settings
- Tool-level access controls
- Integration-specific security policies
- Audit logging configuration

## Performance Tuning

### Connection Settings
- **Timeout**: Server connection timeout
- **Retries**: Connection retry attempts
- **Pooling**: Connection pool size
- **Caching**: Tool list caching duration

### Resource Limits
- **Memory**: Server memory limits
- **CPU**: Processing constraints
- **Concurrency**: Parallel request limits
- **Rate Limiting**: Request throttling

## Development Guidelines

### Adding New Servers
1. Add server configuration to `servers.ts`
2. Update integration mapping in `INTEGRATION_SERVER_MAP`
3. Define required credentials and settings
4. Add validation and error handling
5. Update documentation

### Configuration Validation
- Validate server configurations at startup
- Check required credentials availability
- Verify server executable accessibility
- Test server connectivity before use

### Error Handling
- Graceful degradation on server failures
- Fallback mechanisms for critical tools
- Comprehensive error logging
- User-friendly error messages