# API Module

Clean domain-based API architecture with automatic JWT organization scoping.

## Architecture

```
/api/
├── base/           # Shared functionality
├── services/       # Domain-specific clients  
├── manager/        # Coordination layer
├── helpers.ts      # Response utilities
├── routes.ts       # Route utilities
└── client.ts       # Legacy (backward compatibility)
```

## Quick Start

```typescript
// Use the unified API manager
import { api } from '@/lib/api'

// Domain operations with automatic organization scoping
const agents = await api.agents.getAgents()
const integrations = await api.integrations.getIntegrations()

// Create resources (organization ID auto-extracted from JWT)
const newAgent = await api.agents.createAgent({ name: 'Assistant' })
const newIntegration = await api.integrations.createIntegration({ 
  name: 'Shopify', 
  type: 'shopify' 
})
```

## Domain Clients

### Agents
```typescript
import { AgentApiClient } from '@/lib/api'

const agentClient = new AgentApiClient()
await agentClient.getAgents({ isActive: true })
await agentClient.createAgent(data)
```

### Integrations  
```typescript
import { IntegrationApiClient } from '@/lib/api'

const integrationClient = new IntegrationApiClient()
await integrationClient.getIntegrations({ type: 'shopify' })
await integrationClient.testIntegration(id)
```

### Advanced Usage
```typescript
// Standard authenticated client (auto-scoped to user's organization)
const api = new ApiManager()

// Public (non-authenticated) client for widget/public endpoints  
const publicApi = ApiManager.public()

// Legacy client (backward compatibility)
import { apiClient } from '@/lib/api'
```

## Features

- ✅ **Server-Side Organization Scoping** - Automatic from JWT metadata
- ✅ **Domain Separation** - Clean agent/integration boundaries  
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Error Handling** - Consistent ApiError patterns
- ✅ **Request Timeout** - 10s timeout with AbortController
- ✅ **Backward Compatible** - Legacy client still works
