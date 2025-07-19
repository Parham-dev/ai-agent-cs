import { AgentFormData } from './types'
import { DEFAULT_AI_MODEL } from '@/lib/constants'

// Default values for the agent creation form
export const getDefaultValues = (
  organizationId?: string,
  initialData?: Partial<AgentFormData>
): AgentFormData => ({
  // Basic Information (expanded)
  name: initialData?.name || '',
  description: initialData?.description || '',
  organizationId: organizationId || initialData?.organizationId || 'default-org',
  
  // Instructions & Behavior (now part of Basic Info)
  systemPrompt: initialData?.systemPrompt || '',
  instructionTemplate: initialData?.instructionTemplate || undefined,
  
  // Model & Settings (now part of Basic Info)
  model: initialData?.model || DEFAULT_AI_MODEL, // Updated to use centralized constant
  temperature: initialData?.temperature ?? 0.7,
  maxTokens: initialData?.maxTokens ?? 4000,
  
  // Rules & Behavior (includes outputType and toolChoice)
  rules: initialData?.rules || {
    outputType: 'text',
    toolChoice: 'auto',
    handoffs: [],
    guardrails: { input: [], output: [] },
    customInstructions: []
  },
  
  // Integration Selections
  selectedIntegrations: initialData?.selectedIntegrations || [],
  
  // Tools (new step)
  availableTools: initialData?.availableTools || [],
  selectedTools: initialData?.selectedTools || [],
  
  // Status
  isActive: initialData?.isActive ?? true,
})

// Validation rules for each step
export const stepValidationRules = {
  basicInfo: ['name', 'organizationId', 'systemPrompt', 'model'],
  integrations: [], // Optional step
  tools: [], // Optional step
  advanced: [], // Optional step
  review: [], // No additional validation needed
} as const

// Constants for form limits (updated to match schema)
export const FORM_LIMITS = {
  NAME_MAX_LENGTH: 100,
  NAME_MIN_LENGTH: 1,
  DESCRIPTION_MAX_LENGTH: 500,
  SYSTEM_PROMPT_MIN_LENGTH: 10,
  SYSTEM_PROMPT_MAX_LENGTH: 10000,
  TEMPERATURE_MIN: 0,
  TEMPERATURE_MAX: 2,
  MAX_TOKENS_MIN: 100,
  MAX_TOKENS_MAX: 32000,
} as const
