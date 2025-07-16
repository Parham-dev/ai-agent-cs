# API V2 Documentation

This is the V2 API for the AI Customer Service platform, built on the new normalized database schema.

## Architecture

The V2 API is built on a clean, normalized database schema with the following entities:

- **Organizations**: Top-level entity that manages agents and integrations
- **Agents**: AI agents belonging to an organization with specific system prompts
- **Integrations**: Organization-level integrations (Shopify, Stripe, etc.) with credentials
- **AgentIntegrations**: Many-to-many relationship between agents and integrations

## Base URL

All V2 endpoints are prefixed with `/api/v2/`

## Authentication

// TODO: Add authentication documentation when implemented

## Endpoints

### Organizations

#### GET /api/v2/organizations
Get all organizations with optional filtering.

**Query Parameters:**
- `search` (optional): Search by organization name
- `limit` (optional): Number of results to return
- `offset` (optional): Number of results to skip

**Response:**
```json
{
  "success": true,
  "data": {
    "organizations": [
      {
        "id": "org_123",
        "name": "Acme Corp",
        "slug": "acme-corp",
        "description": "E-commerce company",
        "createdAt": "2025-07-16T12:00:00Z",
        "updatedAt": "2025-07-16T12:00:00Z"
      }
    ]
  }
}
```

#### POST /api/v2/organizations
Create a new organization.

**Request Body:**
```json
{
  "name": "Acme Corp",
  "slug": "acme-corp", // Optional, auto-generated from name if not provided
  "description": "E-commerce company" // Optional
}
```

#### GET /api/v2/organizations/{id}
Get organization by ID.

#### PUT /api/v2/organizations/{id}
Update organization.

#### DELETE /api/v2/organizations/{id}
Delete organization.

### Agents

#### GET /api/v2/agents
Get all agents with optional filtering.

**Query Parameters:**
- `organizationId` (optional): Filter by organization
- `search` (optional): Search by agent name
- `limit` (optional): Number of results to return
- `offset` (optional): Number of results to skip

#### POST /api/v2/agents
Create a new agent.

**Request Body:**
```json
{
  "organizationId": "org_123",
  "name": "Customer Support Agent",
  "description": "Handles customer inquiries", // Optional
  "systemPrompt": "You are a helpful customer support agent..."
}
```

#### GET /api/v2/agents/{id}
Get agent by ID.

#### PUT /api/v2/agents/{id}
Update agent.

#### DELETE /api/v2/agents/{id}
Delete agent.

### Integrations

#### GET /api/v2/integrations
Get all integrations with optional filtering.

**Query Parameters:**
- `organizationId` (optional): Filter by organization
- `type` (optional): Filter by integration type (shopify, stripe, etc.)
- `search` (optional): Search by integration name
- `limit` (optional): Number of results to return
- `offset` (optional): Number of results to skip

#### POST /api/v2/integrations
Create a new integration.

**Request Body:**
```json
{
  "organizationId": "org_123",
  "type": "shopify",
  "name": "My Store",
  "description": "Main Shopify store", // Optional
  "credentials": {
    "apiKey": "...",
    "apiSecret": "...",
    "shopDomain": "mystore.myshopify.com"
  }
}
```

#### GET /api/v2/integrations/{id}
Get integration by ID.

#### PUT /api/v2/integrations/{id}
Update integration.

#### DELETE /api/v2/integrations/{id}
Delete integration.

#### GET /api/v2/integrations/tools
Get available tools for an integration type.

**Query Parameters:**
- `type` (required): Integration type (shopify, stripe, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "tools": [
      {
        "id": "searchProducts",
        "name": "Search Products",
        "description": "Search for products in the store"
      }
    ],
    "integrationType": "shopify",
    "totalCount": 10
  }
}
```

### Agent-Integration Relationships

#### GET /api/v2/agent-integrations
Get agent-integration relationships.

**Query Parameters:**
- `agentId` (optional): Get integrations for a specific agent
- `integrationId` (optional): Get agents using a specific integration

**Response for agentId:**
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": "rel_123",
        "agentId": "agent_123",
        "integrationId": "int_123",
        "isEnabled": true,
        "selectedTools": ["searchProducts", "getOrders"],
        "config": {},
        "createdAt": "2025-07-16T12:00:00Z",
        "integration": {
          "name": "My Store",
          "type": "shopify",
          "isActive": true
        }
      }
    ]
  }
}
```

#### POST /api/v2/agent-integrations
Connect an agent to an integration.

**Request Body:**
```json
{
  "agentId": "agent_123",
  "integrationId": "int_123",
  "selectedTools": ["searchProducts", "getOrders"], // Optional
  "config": {} // Optional
}
```

#### DELETE /api/v2/agent-integrations
Remove agent-integration relationship.

**Query Parameters:**
- `agentId` (required)
- `integrationId` (required)

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": {
        "name": "Agent name is required"
      }
    }
  },
  "metadata": {
    "timestamp": "2025-07-16T12:00:00Z"
  }
}
```

## Error Codes

- `VALIDATION_ERROR` (400): Request validation failed
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (e.g., duplicate name)
- `INTERNAL_ERROR` (500): Server error
- `AGENT_NOT_FOUND` (404): Specific agent not found
- `INTEGRATION_ERROR` (500): Integration-related error

## Migration from V1

The V2 API maintains similar functionality to V1 but with a cleaner data model:

- **Agents**: No longer have embedded integration configurations - these are now separate entities
- **Integrations**: Are organization-level and can be shared across multiple agents
- **Configuration**: Agent-specific integration settings are stored in the AgentIntegration junction table

This allows for:
- Better data normalization
- Reduced duplication
- Easier management of shared integrations
- Cleaner separation of concerns
