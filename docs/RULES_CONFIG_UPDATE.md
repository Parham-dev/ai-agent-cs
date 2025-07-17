# Agent Rules Configuration Update

## Summary
Fixed the agent form structure to correctly place `outputType` and `toolChoice` within the `rules` JSON object instead of as top-level fields, aligning with the actual database schema.

## Key Changes Made

### 1. **Corrected AgentFormData Interface**
**Before (Incorrect):**
```typescript
interface AgentFormData {
  // ... other fields
  outputType: 'text' | 'structured'  // ❌ Not in schema
  toolChoice: 'auto' | 'required' | 'none'  // ❌ Not in schema
  rules: {
    handoffs?: string[]
    guardrails?: { input: string[], output: string[] }
  }
}
```

**After (Correct):**
```typescript
interface AgentFormData {
  // ... other fields
  rules: {
    outputType?: 'text' | 'structured'  // ✅ Part of rules JSON
    toolChoice?: 'auto' | 'required' | 'none'  // ✅ Part of rules JSON
    handoffs?: string[]
    guardrails?: { input: string[], output: string[] }
    customInstructions?: string[]
  }
}
```

### 2. **Updated Form Structure**
Now the Basic Info step includes:
- ✅ **Agent Name** (required)
- ✅ **Agent Description** (optional)
- ✅ **AI Model Selection** (required)
- ✅ **Instruction Templates** (predefined templates)
- ✅ **System Prompt** (required)
- ✅ **Output Type** (part of rules.outputType)
- ✅ **Tool Choice** (part of rules.toolChoice)

### 3. **Removed Separate Instructions Step**
- Merged instructions functionality into Basic Info step
- Simplified wizard from 5 steps to 4 steps
- Better UX with everything in one logical place

### 4. **Added Tools Step**
- New dedicated step for tool selection after integrations
- Allows granular control over available tools
- Separate from integration configuration

### 5. **Updated API Integration**
- Correctly saves `outputType` and `toolChoice` within the `rules` JSON
- Maintains schema compliance
- Proper data mapping for create and edit operations

## New Wizard Flow

1. **Basic Info**: Name, model, templates, instructions, behavior settings
2. **Integrations**: Connected services and APIs
3. **Tools**: Available functions and capabilities  
4. **Advanced**: Rules, guardrails, additional settings
5. **Review**: Final review and creation

## Database Schema Compliance

The form now correctly maps to the Prisma schema:
```prisma
model Agent {
  // ... other fields
  rules Json? @default("{}")  // Contains outputType, toolChoice, etc.
}
```

## Form Field Mapping

**Mantine Form Access:**
- `form.getInputProps('rules.outputType')` ✅
- `form.getInputProps('rules.toolChoice')` ✅

**API Submission:**
```typescript
await apiClient.createAgent({
  // ... other fields
  rules: data.rules  // Contains outputType and toolChoice
})
```

## Results
- ✅ Build successful
- ✅ Schema compliant
- ✅ Proper data structure
- ✅ Working form validation
- ✅ Correct API integration
- ✅ Professional UI with Mantine components
