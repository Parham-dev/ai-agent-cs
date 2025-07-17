# Schema Alignment Update Summary

## Overview
Updated the agent creation wizard types to match the current Prisma v2 schema instead of using outdated v1 types.

## Key Changes Made

### 1. Updated AgentFormData Interface
**Before (v1 types):**
```typescript
interface AgentFormData {
  instructions: string
  topP: number
  toolChoice: 'auto' | 'required' | 'none'
  outputType: 'text' | 'structured'
  selectedTools: string[]
  customTools: CustomTool[]
  enabledIntegrations: string[]
  integrationConfigurations: IntegrationConfiguration[]
  handoffs: string[]
  guardrails: { input: string[], output: string[] }
}
```

**After (v2 schema-aligned):**
```typescript
interface AgentFormData {
  systemPrompt?: string              // Matches Agent.systemPrompt
  maxTokens: number                  // Matches Agent.maxTokens
  rules: {                          // Matches Agent.rules JSON field
    toolChoice?: 'auto' | 'required' | 'none'
    outputType?: 'text' | 'structured'
    handoffs?: string[]
    guardrails?: { input: string[], output: string[] }
    customInstructions?: string[]
  }
  selectedIntegrations: Array<{     // Will create AgentIntegration records
    integrationId: string
    selectedTools: string[]
    config?: Record<string, unknown>
  }>
}
```

### 2. Removed Outdated Interfaces
- `CustomTool` - Tools are now handled through integrations
- `IntegrationConfiguration` - Replaced by `AgentIntegration` table

### 3. Updated Wizard Steps
- Removed "Tools" step (tools are now part of integrations)
- Updated step descriptions to match new schema
- Removed unused imports

### 4. Fixed Form Defaults
- Changed `instructions` to `systemPrompt`
- Updated default `temperature` from 1 to 0.7 (schema default)
- Updated `maxTokens` default to 4000 (schema default)
- Moved tool/integration settings into `rules` object

### 5. Updated Validation Schema
- Renamed validation rules from `instructions` to `systemPrompt`
- Added `maxTokens` validation
- Removed `topP` validation (not in schema)
- Updated limits constants

### 6. Fixed API Integration
Both agent creation and editing pages now correctly map to the schema:
```typescript
// API call now matches UpdateAgentRequest interface
await apiClient.updateAgent(id, {
  name: data.name,
  description: data.description,
  systemPrompt: data.systemPrompt,    // Not 'instructions'
  model: data.model,
  temperature: data.temperature,
  maxTokens: data.maxTokens,           // Not hardcoded 4000
  rules: data.rules,                   // Structured rules object
  isActive: data.isActive
})
```

## Files Updated
- `components/agents/creation/forms/types.ts`
- `components/agents/creation/forms/defaults.ts`
- `components/agents/creation/forms/schema.ts`
- `components/agents/creation/wizard/AgentCreationWizard.tsx`
- `components/agents/creation/index.ts`
- `app/agents/new/page.tsx`
- `app/agents/[id]/edit/page.tsx`

## Schema Alignment
All types now match the Prisma v2 schema:
- ✅ Agent table fields (systemPrompt, maxTokens, rules)
- ✅ AgentIntegration table structure
- ✅ Integration handling through relationships
- ✅ Rules stored as JSON in Agent.rules field

## Testing
- ✅ TypeScript compilation successful
- ✅ All imports resolved correctly
- ✅ Build passes without errors
- ✅ No unused variables or types

The wizard foundation is now properly aligned with your v2 schema and ready for Phase 2 implementation with actual form fields.
