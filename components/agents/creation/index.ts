// Export the new wizard components
export { AgentCreationWizard } from './wizard/AgentCreationWizard'

// Export form types and utilities
export type { AgentFormData, StepProps } from './forms/types'
export { getDefaultValues } from './forms/defaults'
export { createValidationSchema, validateStep } from './forms/schema'

// Export step components (updated structure)
export { BasicInfoStep } from './steps/BasicInfoStep'
export { IntegrationsStep } from './steps/IntegrationsStep'
export { ToolsStep } from './steps/ToolsStep'
export { AdvancedStep } from './steps/AdvancedStep'
export { ReviewStep } from './steps/ReviewStep'
