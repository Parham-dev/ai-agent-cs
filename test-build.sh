#!/bin/bash

echo "Testing TypeScript compilation..."

# Test individual files
echo "Testing route-factory.ts..."
npx tsc --noEmit lib/mcp/route-factory.ts --esModuleInterop --skipLibCheck --strict false

echo "Testing client-v2.ts..."
npx tsc --noEmit lib/mcp/client-v2.ts --esModuleInterop --skipLibCheck --strict false

echo "Testing credentials/provider.ts..."
npx tsc --noEmit lib/mcp/credentials/provider.ts --esModuleInterop --skipLibCheck --strict false

echo "Testing tools/registry.ts..."
npx tsc --noEmit lib/mcp/tools/registry.ts --esModuleInterop --skipLibCheck --strict false

echo "Testing client/server-factory.ts..."
npx tsc --noEmit lib/mcp/client/server-factory.ts --esModuleInterop --skipLibCheck --strict false

echo "Running eslint on MCP files..."
npx eslint lib/mcp/**/*.ts --max-warnings 0