import { AgentFormData } from './types'
import { DEFAULT_AI_MODEL } from '@/lib/constants'
import type { OrganizationSettings } from '@/lib/api/services/organization-client'

// Default values for the agent creation form  
export const getDefaultValues = (
  initialData?: Partial<AgentFormData>,
  orgSettings?: OrganizationSettings
): AgentFormData => ({
  // Basic Information (expanded)
  name: initialData?.name || '',
  description: initialData?.description || '',
  
  // Instructions & Behavior (now part of Basic Info)
  systemPrompt: initialData?.systemPrompt || orgSettings?.defaultInstructions || '',
  instructionTemplate: initialData?.instructionTemplate || undefined,
  
  // Model & Settings (now part of Basic Info) - use org settings if available
  model: initialData?.model || orgSettings?.defaultModel || DEFAULT_AI_MODEL,
  temperature: initialData?.temperature ?? orgSettings?.defaultTemperature ?? 0.7,
  maxTokens: initialData?.maxTokens ?? orgSettings?.defaultMaxTokens ?? 4000,
  
  // Rules & Behavior (includes outputType and toolChoice) - use org settings
  rules: initialData?.rules || {
    outputType: (orgSettings?.defaultOutputType === 'json' ? 'structured' : orgSettings?.defaultOutputType) || 'text',
    toolChoice: orgSettings?.defaultToolChoice || 'auto',
    handoffs: [],
    guardrails: { 
      input: [], 
      output: [], 
      customInstructions: { input: '', output: '' } 
    },
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
  basicInfo: ['name', 'systemPrompt', 'model'],
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
