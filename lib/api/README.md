# API Module

Client-side API utilities for communicating with the backend services.

## Files

- **`client.ts`** - Main API client class with all endpoint methods
- **`helpers.ts`** - Response handling utilities and validation helpers
- **`error-handling.ts`** - Smart error detection and handling wrapper
- **`route-utils.ts`** - Utilities to reduce boilerplate in API routes
- **`index.ts`** - Module exports and convenience re-exports

## Usage

```typescript
// Import the authenticated API client
import { apiClient } from '@/lib/api/authenticated-client'

// Use API helpers
import { ApiResponseHelper as Api } from '@/lib/api/helpers'

// Use smart error handling
import { withErrorHandling } from '@/lib/api/error-handling'

// Simplified route creation
import { createRouteHandler } from '@/lib/api/route-utils'

// Get data (automatically filtered by user's organization)
const agents = await apiClient.getAgents()
const response = Api.success(data)

// Create routes with less boilerplate
export const { GET, POST } = createRouteHandler(service, config)
```

## Features

- ✅ Organization-scoped requests
- ✅ Smart error detection and handling
- ✅ TypeScript support with strong typing
- ✅ Built-in request/response formatting
- ✅ Route generation utilities
- ✅ Consistent validation patterns
