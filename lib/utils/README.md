# Utils Module

Common utility functions and helpers used throughout the application.

## Files

### Core Utilities
- **`cn.ts`** - Tailwind CSS class merging utility (`clsx` + `tailwind-merge`)
- **`errors.ts`** - Custom error classes for consistent error handling

### Logging
- **`logger.ts`** - Server-side structured logging system
- **`client-logger.ts`** - Client-side logging for React components

### Authentication  
- **`jwt.ts`** - JWT token utilities for widget authentication

### Exports
- **`index.ts`** - Centralized exports for all utilities

## Usage

```typescript
// Import from main lib (common utilities)
import { cn } from '@/lib'

// Import specific utilities directly
import { logger } from '@/lib/utils/logger'
import { verifyWidgetToken } from '@/lib/utils/jwt'

// Use utilities
const classes = cn('bg-blue-500', { 'text-white': isActive })
logger.info('Operation completed', { userId })
```

## Organization

- **UI helpers**: CSS/styling utilities
- **Error handling**: Custom error classes
- **Logging**: Structured logging for server and client
- **Auth**: JWT and token utilities
