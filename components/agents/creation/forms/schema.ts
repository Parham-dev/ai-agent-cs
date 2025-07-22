import { AgentFormData } from './types'
import { FORM_LIMITS } from './defaults'

// Validation functions for Mantine form
export const createValidationSchema = () => ({
  // Basic Information
  name: (value: string) => {
    if (!value || value.length < FORM_LIMITS.NAME_MIN_LENGTH) {
      return 'Agent name is required'
    }
    if (value.length > FORM_LIMITS.NAME_MAX_LENGTH) {
      return `Name must be ${FORM_LIMITS.NAME_MAX_LENGTH} characters or less`
    }
    return null
  },

  description: (value?: string) => {
    if (value && value.length > FORM_LIMITS.DESCRIPTION_MAX_LENGTH) {
      return `Description must be ${FORM_LIMITS.DESCRIPTION_MAX_LENGTH} characters or less`
    }
    return null
  },

  // Instructions (renamed to systemPrompt to match schema)
  systemPrompt: (value?: string) => {
    if (!value || value.length < FORM_LIMITS.SYSTEM_PROMPT_MIN_LENGTH) {
      return `System prompt must be at least ${FORM_LIMITS.SYSTEM_PROMPT_MIN_LENGTH} characters`
    }
    if (value.length > FORM_LIMITS.SYSTEM_PROMPT_MAX_LENGTH) {
      return `System prompt must be ${FORM_LIMITS.SYSTEM_PROMPT_MAX_LENGTH} characters or less`
    }
    return null
  },

  // Model settings
  model: (value: string) => {
    if (!value) {
      return 'AI model is required'
    }
    return null
  },

  temperature: (value: number) => {
    if (value < FORM_LIMITS.TEMPERATURE_MIN || value > FORM_LIMITS.TEMPERATURE_MAX) {
      return `Temperature must be between ${FORM_LIMITS.TEMPERATURE_MIN} and ${FORM_LIMITS.TEMPERATURE_MAX}`
    }
    return null
  },

  maxTokens: (value: number) => {
    if (value < FORM_LIMITS.MAX_TOKENS_MIN || value > FORM_LIMITS.MAX_TOKENS_MAX) {
      return `Max tokens must be between ${FORM_LIMITS.MAX_TOKENS_MIN} and ${FORM_LIMITS.MAX_TOKENS_MAX}`
    }
    return null
  },

  // Validation for rules object fields
  'rules.outputType': (value: string) => {
    if (!['text', 'structured'].includes(value)) {
      return 'Invalid output type'
    }
    return null
  },

  'rules.toolChoice': (value: string) => {
    if (!['auto', 'required', 'none'].includes(value)) {
      return 'Invalid tool choice'
    }
    return null
  },
})

// Helper function to validate specific step
export const validateStep = (
  stepId: string,
  formData: Partial<AgentFormData>
): { isValid: boolean; errors: string[] } => {
  const validationSchema = createValidationSchema()
  const errors: string[] = []

  switch (stepId) {
    case 'basicInfo':
      if (validationSchema.name(formData.name || '')) {
        errors.push(validationSchema.name(formData.name || '') as string)
      }
      if (validationSchema.systemPrompt(formData.systemPrompt || '')) {
        errors.push(validationSchema.systemPrompt(formData.systemPrompt || '') as string)
      }
      if (validationSchema.model(formData.model || '')) {
        errors.push(validationSchema.model(formData.model || '') as string)
      }
      if (validationSchema['rules.outputType'](formData.rules?.outputType || '')) {
        errors.push(validationSchema['rules.outputType'](formData.rules?.outputType || '') as string)
      }
      if (validationSchema['rules.toolChoice'](formData.rules?.toolChoice || '')) {
        errors.push(validationSchema['rules.toolChoice'](formData.rules?.toolChoice || '') as string)
      }
      break

    case 'integrations':
      // Validate that there are no temp integrations without credentials
      if (formData.selectedIntegrations) {
        const tempIntegrations = formData.selectedIntegrations.filter(integration => 
          integration.integrationId.startsWith('temp-')
        );
        
        if (tempIntegrations.length > 0) {
          errors.push('Please configure credentials for all selected integrations.');
        }
      }
      break
      
    case 'review':
      // Final validation - ensure no temp integrations
      if (formData.selectedIntegrations) {
        const tempIntegrations = formData.selectedIntegrations.filter(integration => 
          integration.integrationId.startsWith('temp-')
        );
        
        if (tempIntegrations.length > 0) {
          errors.push('Cannot create agent with unconfigured integrations. Please go back and configure credentials for all selected integrations.');
        }
      }
      break
      
    // Other steps are optional for now
    case 'tools':
    case 'advanced':
      break

    default:
      break
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
