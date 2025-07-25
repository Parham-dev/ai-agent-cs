# MCP Tool Filtering System

## Overview

This document explains how the MCP tool filtering system ensures that agents only have access to the specific tools selected in the database under `agentIntegration.selectedTools`.

## The Problem

When an agent has a Shopify integration with `selectedTools: ["searchProducts", "getProductDetails"]`, the agent should ONLY see these 2 tools, not all 13 Shopify tools.

## The Solution

### 1. **Database Structure**
```typescript
// AgentIntegration table
{
  agentId: "agent123",
  integrationId: "shopify-integration",
  isEnabled: true,
  selectedTools: [
    "searchProducts",
    "getProductDetails", 
    "listProducts"
  ]
}
```

### 2. **Tool Filtering Flow**

```
Database → Agent Factory → MCP Client → MCP Server → Filtered Tools
```

1. **Agent Factory** reads `selectedTools` from database
2. **MCP Client** passes selected tools via:
   - URL query parameter: `?selectedTools=tool1,tool2`
   - HTTP header: `x-mcp-selected-tools: ["tool1","tool2"]`
3. **MCP Server** filters tools before registration
4. **Agent** only sees the filtered tools

### 3. **Implementation Details**

#### Dynamic Route Handler (`/api/mcp/[server]/route.ts`)
```typescript
// Extracts selected tools from request
const selectedToolsHeader = request.headers.get('x-mcp-selected-tools');
const selectedTools = JSON.parse(selectedToolsHeader);

// Gets filtered server configuration
const config = await getMcpServerConfig(serverName, selectedTools);
```

#### Registry with Filtering (`/lib/mcp/config/registry.ts`)
```typescript
export async function getMcpServerConfig(
  serverName: string, 
  selectedTools?: string[]
): Promise<McpServerConfig | null> {
  const config = MCP_SERVER_REGISTRY[serverName];
  
  // Filter tools if selectedTools provided
  if (selectedTools && selectedTools.length > 0) {
    const filteredTools = config.tools.filter(tool => 
      selectedTools.includes(tool.name)
    );
    
    return {
      ...config,
      tools: filteredTools
    };
  }
  
  return config;
}
```

#### MCP Client Integration
```typescript
// In MCPClient.initializeServer()
const requestInit: RequestInit = uniqueSelectedTools ? {
  headers: {
    'x-mcp-selected-tools': JSON.stringify(uniqueSelectedTools)
  }
} : {};

const mcpServer = new MCPServerStreamableHttp({
  name: config.name,
  url: serverUrl,
  requestInit, // Passes header with every request
  cacheToolsList: true
});
```

## Example Scenario

### Agent Configuration
```json
{
  "agent": "Customer Service Bot",
  "integrations": [
    {
      "type": "shopify",
      "selectedTools": [
        "searchProducts",
        "getProductDetails",
        "getOrderTracking"
      ]
    }
  ]
}
```

### What Happens
1. Agent requests MCP server connection
2. MCP client adds header: `x-mcp-selected-tools: ["searchProducts","getProductDetails","getOrderTracking"]`
3. MCP server receives request and filters 13 tools down to 3
4. Agent can only call these 3 tools

### Logs
```
[INFO] MCP request received {
  serverName: 'shopify',
  selectedTools: ['searchProducts', 'getProductDetails', 'getOrderTracking'],
  hasSelectedTools: true
}

[DEBUG] Retrieved MCP server configuration with filtered tools {
  serverName: 'shopify',
  originalToolCount: 13,
  selectedToolCount: 3,
  filteredToolCount: 3,
  filteredToolNames: ['searchProducts', 'getProductDetails', 'getOrderTracking']
}
```

## Benefits

1. **Security**: Agents can't access tools they shouldn't have
2. **Cost Control**: Limits API calls to only necessary endpoints
3. **User Experience**: Cleaner tool list for agents
4. **Compliance**: Ensures data access restrictions are enforced

## Testing

### Manual Testing
```bash
# Test with query parameter
curl http://localhost:3000/api/mcp/shopify?selectedTools=searchProducts,getProductDetails

# Test with header
curl -H "x-mcp-selected-tools: [\"searchProducts\",\"getProductDetails\"]" \
  http://localhost:3000/api/mcp/shopify
```

### Validation
The system validates that selected tools actually exist:
```typescript
const validation = validateSelectedTools(
  ALL_SHOPIFY_TOOLS,
  ['searchProducts', 'invalidTool']
);
// Returns: { valid: ['searchProducts'], invalid: ['invalidTool'] }
```

## Future Enhancements

1. **Tool Permissions**: Add role-based permissions per tool
2. **Dynamic Tool Loading**: Load tool implementations on-demand
3. **Tool Versioning**: Support different versions of tools
4. **Audit Logging**: Track which tools are used by which agents