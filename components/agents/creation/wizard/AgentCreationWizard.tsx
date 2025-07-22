'use client'

import { useState } from 'react'
import { useForm } from '@mantine/form'
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  Stepper, 
  Group, 
  Button, 
  Stack,
  LoadingOverlay
} from '@mantine/core'
import { 
  Bot, 
  Plug, 
  Wrench,
  Settings, 
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { AgentFormData } from '../forms/types'
import { getDefaultValues } from '../forms/defaults'
import { createValidationSchema, validateStep } from '../forms/schema'

// Import step components
import { BasicInfoStep } from '../steps/BasicInfoStep'
import { IntegrationsStep } from '../steps/IntegrationsStep'
import { ToolsStep } from '../steps/ToolsStep'
import { AdvancedStep } from '../steps/AdvancedStep'
import { ReviewStep } from '../steps/ReviewStep'
import { usePreloadIntegrations } from '@/components/shared/integrations'
import { useModels } from '@/components/shared/hooks/useModels'
import { useOrganizationSettings } from '@/components/shared/hooks/useOrganizationSettings'

// Define wizard steps (updated structure)
const WIZARD_STEPS = [
  {
    id: 'basicInfo',
    label: 'Basic Info',
    description: 'Name, model, instructions, and behavior settings',
    icon: <Bot size={20} />,
    component: BasicInfoStep,
    isRequired: true,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Connected services and APIs',
    icon: <Plug size={20} />,
    component: IntegrationsStep,
    isRequired: false,
  },
  {
    id: 'tools',
    label: 'Tools',
    description: 'Available functions and capabilities',
    icon: <Wrench size={20} />,
    component: ToolsStep,
    isRequired: false,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Rules, guardrails, and additional settings',
    icon: <Settings size={20} />,
    component: AdvancedStep,
    isRequired: false,
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Review and create agent',
    icon: <CheckCircle size={20} />,
    component: ReviewStep,
    isRequired: true,
  },
] as const

interface AgentCreationWizardProps {
  initialData?: Partial<AgentFormData>
  mode?: 'create' | 'edit'
  onSave?: (data: AgentFormData) => Promise<void>
  onCancel?: () => void
}

export function AgentCreationWizard({
  initialData,
  mode = 'create',
  onSave,
  onCancel,
}: AgentCreationWizardProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [highestStepVisited, setHighestStepVisited] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Preload data for faster step navigation
  usePreloadIntegrations()
  const { models } = useModels()
  const { settings } = useOrganizationSettings()

  // Initialize form with Mantine useForm hook
  const form = useForm<AgentFormData>({
    mode: 'controlled',
    initialValues: getDefaultValues(initialData, settings),
    validate: createValidationSchema(),
  })

  // Handle step navigation
  const handleStepChange = (nextStep: number) => {
    // Validate current step before moving forward
    if (nextStep > activeStep) {
      const currentStepId = WIZARD_STEPS[activeStep].id
      const validation = validateStep(currentStepId, form.getValues())
      
      if (!validation.isValid) {
        // Show validation errors
        console.log('Validation errors:', validation.errors)
        return
      }
    }

    // Update active step and highest visited step
    setActiveStep(nextStep)
    setHighestStepVisited(Math.max(highestStepVisited, nextStep))
  }

  // Check if step can be selected
  const canSelectStep = (stepIndex: number) => {
    return stepIndex <= highestStepVisited
  }

  // Check if current step is valid and Next button should be enabled
  const isCurrentStepValid = () => {
    const currentStepId = WIZARD_STEPS[activeStep].id
    const validation = validateStep(currentStepId, form.getValues())
    return validation.isValid
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (activeStep === WIZARD_STEPS.length - 1) {
      // Final submission
      setIsSubmitting(true)
      try {
        const formData = form.getValues()
        await onSave?.(formData)
      } catch (error) {
        console.error('Failed to save agent:', error)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Move to next step
      handleStepChange(activeStep + 1)
    }
  }

  // Get current step component
  const CurrentStepComponent = WIZARD_STEPS[activeStep].component
  const currentStep = WIZARD_STEPS[activeStep]

  return (
    <Container size="lg" py="md">
      <Paper shadow="sm" radius="md" p="xl" pos="relative">
        <LoadingOverlay visible={isSubmitting} />
        
        <Stack gap="lg">
          {/* Header with Back Button */}
          <Stack gap="md">
            {/* Back Navigation */}
            {onCancel && (
              <Group>
                <Button 
                  variant="subtle" 
                  size="sm" 
                  leftSection={<ChevronLeft size={16} />}
                  onClick={onCancel}
                  c="dimmed"
                >
                  Back to Agents
                </Button>
              </Group>
            )}
            
            {/* Title and Navigation - Updated Layout */}
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Title order={1} size="h2" ta="left">
                  {mode === 'edit' ? 'Edit Agent' : 'Create New Agent'}
                </Title>
                <Text c="dimmed" ta="left" size="sm">
                  {currentStep.description}
                </Text>
              </Stack>
              
              {/* Header Navigation Buttons */}
              <Group gap="sm">
                <Button
                  variant="subtle"
                  size="sm"
                  leftSection={<ChevronLeft size={16} />}
                  onClick={() => handleStepChange(activeStep - 1)}
                  disabled={activeStep === 0}
                >
                  Previous
                </Button>

                <Button
                  size="sm"
                  rightSection={
                    activeStep === WIZARD_STEPS.length - 1 ? 
                      undefined : 
                      <ChevronRight size={16} />
                  }
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting || !isCurrentStepValid()}
                >
                  {activeStep === WIZARD_STEPS.length - 1 
                    ? (mode === 'edit' ? 'Update Agent' : 'Create Agent')
                    : 'Next'
                  }
                </Button>
              </Group>
            </Group>
          </Stack>

          {/* Compact Stepper */}
          <Stepper 
            active={activeStep} 
            onStepClick={(step) => canSelectStep(step) && handleStepChange(step)}
            allowNextStepsSelect={false}
            size="sm"
            color="blue"
            iconSize={32}
          >
            {WIZARD_STEPS.map((step, index) => (
              <Stepper.Step
                key={step.id}
                label={step.label}
                icon={step.icon}
                allowStepSelect={canSelectStep(index)}
                color={step.isRequired ? 'blue' : 'gray'}
              />
            ))}
          </Stepper>

          {/* Step Content */}
          <Paper withBorder radius="md" p="md" mih={350}>
            <CurrentStepComponent 
              form={form}
              onNext={() => handleStepChange(activeStep + 1)}
              onPrevious={() => handleStepChange(activeStep - 1)}
              availableModels={models}
              organizationSettings={settings}
            />
          </Paper>

          {/* Navigation - Secondary */}
          <Group justify="space-between" pt="sm">
            <Button
              variant="subtle"
              leftSection={<ChevronLeft size={16} />}
              onClick={() => handleStepChange(activeStep - 1)}
              disabled={activeStep === 0}
              size="xs"
              c="dimmed"
            >
              Previous
            </Button>

            <Button
              rightSection={
                activeStep === WIZARD_STEPS.length - 1 ? 
                  undefined : 
                  <ChevronRight size={16} />
              }
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || !isCurrentStepValid()}
              size="xs"
            >
              {activeStep === WIZARD_STEPS.length - 1 
                ? (mode === 'edit' ? 'Update Agent' : 'Create Agent')
                : 'Next'
              }
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  )
}
