# Migration Strategy: From Current to V2 Schema

## Current State:
- `Agent.agentConfig` contains integration relationships
- `Integration.settings` contains tools (will be removed)
- No `AgentIntegration` table

## Target State (V2):
- `AgentIntegration` table with `selectedTools` array
- `Agent.rules` instead of complex `agentConfig`
- Clean separation of concerns

## Migration Script TODO:

1. **Create new schema** (backup + modify prisma/schema.prisma)
2. **Create migration** to add new tables
3. **Data migration** to move data from JSON to normalized tables
4. **Remove old fields** after data is migrated

## For Now - Let's Test Build Without V2 Services

Since the new schema doesn't exist yet, the V2 services will fail. Let me create a simple test to verify our types are correct when the schema exists.
