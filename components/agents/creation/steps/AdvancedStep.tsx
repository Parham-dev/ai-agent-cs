'use client'

import { Stack, Title, Text } from '@mantine/core'
import { StepProps } from '../forms/types'
import { GuardrailSection } from '../shared/GuardrailSection'

export function AdvancedStep({ form }: StepProps) {
  const handleToggleGuardrail = (guardrailId: string, type: 'input' | 'output') => {
    const currentGuardrails = form.values.rules.guardrails?.[type] || []
    
    if (currentGuardrails.includes(guardrailId)) {
      // Remove guardrail
      form.setFieldValue(`rules.guardrails.${type}`, 
        currentGuardrails.filter(id => id !== guardrailId)
      )
    } else {
      // Add guardrail
      form.setFieldValue(`rules.guardrails.${type}`, 
        [...currentGuardrails, guardrailId]
      )
    }
  }

  const handleToggleInputGuardrail = (guardrailId: string) => {
    handleToggleGuardrail(guardrailId, 'input')
  }

  const handleToggleOutputGuardrail = (guardrailId: string) => {
    handleToggleGuardrail(guardrailId, 'output')
  }
  
  const handleCustomInputInstructions = (instructions: string) => {
    form.setFieldValue('rules.guardrails.customInstructions.input', instructions)
  }
  
  const handleCustomOutputInstructions = (instructions: string) => {
    form.setFieldValue('rules.guardrails.customInstructions.output', instructions)
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={3}>Guardrails Settings</Title>
        <Text c="dimmed">
          Configure guardrails to protect your agent and users with automated content validation.
        </Text>
      </div>

      <Stack gap="lg">
        <GuardrailSection
          type="input"
          selectedGuardrails={form.values.rules.guardrails?.input || []}
          onToggleGuardrail={handleToggleInputGuardrail}
          customInstructions={form.values.rules.guardrails?.customInstructions?.input || ''}
          onCustomInstructionsChange={handleCustomInputInstructions}
        />

        <GuardrailSection
          type="output"
          selectedGuardrails={form.values.rules.guardrails?.output || []}
          onToggleGuardrail={handleToggleOutputGuardrail}
          customInstructions={form.values.rules.guardrails?.customInstructions?.output || ''}
          onCustomInstructionsChange={handleCustomOutputInstructions}
        />
      </Stack>
    </Stack>
  )
}
