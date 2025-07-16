'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { getOrganizationId } from '@/lib/context/organization'
import {
  AgentSetupStep,
  ToolsStep,
  IntegrationsStep,
  AdvancedStep,
  ReviewStep
} from './wizard-steps'

// Form schema definition
const agentFormSchema = z.object({
  // Basic Info
  name: z.string().min(1, 'Agent name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  organizationId: z.string().min(1, 'Organization is required'),
  
  // Instructions
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  instructionTemplate: z.string().optional(),
  
  // Model & Settings
  model: z.string().default('gpt-4o'),
  temperature: z.number().min(0).max(2).default(1),
  topP: z.number().min(0).max(1).default(1),
  toolChoice: z.enum(['auto', 'required', 'none']).default('auto'),
  outputType: z.enum(['text', 'structured']).default('text'),
  
  // Tools
  selectedTools: z.array(z.string()).default([]),
  customTools: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.unknown())
  })).default([]),
  
  // Integrations
  enabledIntegrations: z.array(z.string()).default([]),
  integrationConfigurations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    credentials: z.record(z.unknown()),
    selectedTools: z.array(z.string()).default([]),
    isConnected: z.boolean().default(false),
    settings: z.record(z.unknown()).default({})
  })).default([]),
  
  // Advanced
  handoffs: z.array(z.string()).default([]),
  guardrails: z.object({
    input: z.array(z.string()).default([]),
    output: z.array(z.string()).default([])
  }).default({ input: [], output: [] }),
  
  isActive: z.boolean().default(true)
})

export type AgentFormData = z.infer<typeof agentFormSchema>

const STEPS = [
  { id: 'setup', title: 'Agent Setup', description: 'Name, instructions, and model configuration' },
  { id: 'integrations', title: 'Integrations', description: 'Connected services' },
  { id: 'tools', title: 'Tools', description: 'Available functions and APIs' },
  { id: 'advanced', title: 'Advanced', description: 'Handoffs and guardrails' },
  { id: 'review', title: 'Review', description: 'Test and publish' }
] as const

type StepId = typeof STEPS[number]['id']

interface AgentCreationWizardProps {
  organizationId?: string
  initialData?: Partial<AgentFormData>
  mode?: 'create' | 'edit'
  onSave?: (data: AgentFormData) => Promise<void>
  onCancel?: () => void
}

export function AgentCreationWizard({ 
  organizationId, 
  initialData,
  mode = 'create',
  onSave
}: AgentCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<StepId>('setup')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Merge initial data with defaults - use hardcoded organization
  const defaultValues = {
    organizationId: organizationId || initialData?.organizationId || getOrganizationId(),
    model: initialData?.model || 'gpt-4o',
    temperature: initialData?.temperature || 1,
    topP: initialData?.topP || 1,
    toolChoice: initialData?.toolChoice || 'auto',
    outputType: initialData?.outputType || 'text',
    selectedTools: initialData?.selectedTools || [],
    customTools: initialData?.customTools || [],
    enabledIntegrations: initialData?.enabledIntegrations || [],
    integrationConfigurations: initialData?.integrationConfigurations || [],
    handoffs: initialData?.handoffs || [],
    guardrails: initialData?.guardrails || { input: [], output: [] },
    isActive: initialData?.isActive ?? true,
    name: initialData?.name || '',
    instructions: initialData?.instructions || '',
    description: initialData?.description || '',
    instructionTemplate: initialData?.instructionTemplate || ''
  }

  const form = useForm({
    resolver: zodResolver(agentFormSchema),
    defaultValues
  })

  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  const canGoNext = () => {
    const requiredFields = getRequiredFieldsForStep(currentStep)
    const isValid = requiredFields.every(field => {
      const value = form.getValues(field as keyof AgentFormData)
      console.log(`Field ${field}:`, value) // Debug log
      return value !== undefined && value !== ''
    })
    console.log('Can go next:', isValid) // Debug log
    return isValid
  }

  const canGoPrevious = () => currentStepIndex > 0

  const goToStep = (stepId: StepId) => {
    setCurrentStep(stepId)
  }

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id)
    }
  }

  const goPrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id)
    }
  }

  const handleSubmit = async (data: AgentFormData) => {
    if (currentStep === 'review') {
      setIsSubmitting(true)
      try {
        await onSave?.(data)
      } catch (error) {
        console.error('Failed to save agent:', error)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      goNext()
    }
  }

  const getRequiredFieldsForStep = (stepId: StepId): string[] => {
    switch (stepId) {
      case 'setup':
        return ['name', 'organizationId', 'instructions', 'model']
      case 'tools':
      case 'integrations':
      case 'advanced':
      case 'review':
        return []
      default:
        return []
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'setup':
        return <AgentSetupStep form={form} />
      case 'integrations':
        return <IntegrationsStep form={form} />
      case 'tools':
        return <ToolsStep form={form} />
      case 'advanced':
        return <AdvancedStep form={form} />
      case 'review':
        return <ReviewStep form={form} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Three-Column Header */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
          {/* Left: Title and Description */}
          <div>
            <h2 className="text-2xl font-bold">{STEPS[currentStepIndex].title}</h2>
            <p className="text-muted-foreground">{STEPS[currentStepIndex].description}</p>
          </div>
          
          {/* Center: Step Navigation Pills */}
          <div className="flex justify-center gap-2">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  step.id === currentStep
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : index < currentStepIndex
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                }`}
                disabled={index > currentStepIndex}
                title={step.title}
              >
                {index < currentStepIndex ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
            ))}
          </div>
          
          {/* Right: Next Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (currentStep === 'review') {
                  form.handleSubmit(handleSubmit)()
                } else {
                  goNext()
                }
              }}
              disabled={!canGoNext() || isSubmitting}
              loading={isSubmitting}
              className="min-w-[120px]"
            >
              {currentStep === 'review' ? (
                mode === 'edit' ? 'Update Agent' : 'Create Agent'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <Progress value={progress} className="h-1" />
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {renderStepContent()}
            
            {/* Bottom Navigation - Secondary */}
            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div>
                {canGoPrevious() && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goPrevious}
                    size="sm"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={!canGoNext() || isSubmitting}
                loading={isSubmitting}
                size="sm"
                variant="outline"
                className="min-w-[100px]"
              >
                {currentStep === 'review' ? (
                  mode === 'edit' ? 'Update' : 'Create'
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

