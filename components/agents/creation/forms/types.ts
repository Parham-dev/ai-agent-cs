export interface AgentFormData {
  // Basic Information (expanded to include everything from Instructions step)
  name: string
  description?: string
  
  // Instructions & Behavior (now part of Basic Info)
  systemPrompt?: string
  instructionTemplate?: string
  
  // Model & Settings (now part of Basic Info)
  model: string
  temperature: number
  maxTokens: number
  
  // Rules & Behavior (includes outputType and toolChoice)
  rules: {
    outputType?: 'text' | 'structured'
    toolChoice?: 'auto' | 'required' | 'none'
    handoffs?: string[]
    guardrails?: {
      input: string[]
      output: string[]
      customInstructions?: {
        input?: string
        output?: string
      }
    }
    customInstructions?: string[]
  }
  
  // Integration Selections (will create AgentIntegration records)
  selectedIntegrations: Array<{
    integrationId: string
    selectedTools: string[]
    config?: Record<string, unknown>
  }>
  
  // Tools (new step)
  availableTools: string[]
  selectedTools: string[]
  
  // Status (matches Agent schema)
  isActive: boolean
}

// Remove outdated interfaces that don't match schema
// CustomTool is not in the schema - tools are handled through integrations
// IntegrationConfiguration is replaced by AgentIntegration

// Available integration info for selection
export interface AvailableIntegration {
  id: string
  name: string
  type: string
  description?: string
  isActive: boolean
  availableTools: string[]
}

export interface InstructionTemplate {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  systemPrompt: string
  category: 'support' | 'sales' | 'technical' | 'general'
}

export interface AIModel {
  value: string
  label: string
  description: string
  provider: 'openai' | 'anthropic' | 'google' | 'local'
  contextWindow: number
  pricing?: {
    input: number
    output: number
  }
}

export interface WizardStep {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  isOptional?: boolean
  requiresValidation?: boolean
}

import { UseFormReturnType } from '@mantine/form'

export interface StepProps {
  form: UseFormReturnType<AgentFormData>
  onNext?: () => void
  onPrevious?: () => void
  // Optional SWR data - only passed when available
  availableModels?: import('@/lib/api/services/models-client').AIModel[]
  organizationSettings?: import('@/lib/api/services/organization-client').OrganizationSettings
}
