'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
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
  dynamicInstructions: z.boolean().default(false),
  
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
  onSave, 
  onCancel 
}: AgentCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<StepId>('setup')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Merge initial data with defaults
  const defaultValues = {
    organizationId: organizationId || initialData?.organizationId || 'cmd50brq20000jgtb8lqfol4o',
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
    dynamicInstructions: initialData?.dynamicInstructions || false,
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
      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="text-sm text-muted-foreground text-center">
          Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex].title}
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center gap-2 bg-muted rounded-lg p-1">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                step.id === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStepIndex
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              disabled={index > currentStepIndex}
            >
              {index < currentStepIndex && (
                <Check className="w-4 h-4 inline mr-1" />
              )}
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">{index + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {renderStepContent()}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <div>
                {canGoPrevious() && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goPrevious}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={!canGoNext() || isSubmitting}
                  loading={isSubmitting}
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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

