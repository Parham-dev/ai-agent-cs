'use client'

import { Text, Stack, Grid } from '@mantine/core'
import { Download, Upload } from 'lucide-react'
import { GuardrailCard } from './GuardrailCard'
import { getAvailableGuardrails } from '@/lib/guardrails'

interface GuardrailSectionProps {
  type: 'input' | 'output'
  selectedGuardrails: string[]
  onToggleGuardrail: (guardrailId: string) => void
  customInstructions?: string
  onCustomInstructionsChange?: (instructions: string) => void
}

export function GuardrailSection({
  type,
  selectedGuardrails,
  onToggleGuardrail,
  customInstructions = '',
  onCustomInstructionsChange
}: GuardrailSectionProps) {
  const availableGuardrails = getAvailableGuardrails(type)
  const Icon = type === 'input' ? Download : Upload
  const title = type === 'input' ? 'Input Guardrails' : 'Output Guardrails'
  const description = type === 'input' 
    ? 'Validate and filter user input before processing'
    : 'Review and ensure quality of agent responses'

  if (availableGuardrails.length === 0) {
    return null
  }

  return (
    <Stack gap="sm">
      <div className="flex items-center gap-2">
        <Icon size={20} />
        <div>
          <Text fw={500} size="sm">{title}</Text>
          <Text size="xs" c="dimmed">{description}</Text>
        </div>
      </div>
      
      <Grid>
        {availableGuardrails.map((guardrail) => {
          const isCustom = guardrail.id === `custom-${type}`;
          return (
            <Grid.Col key={guardrail.id} span={isCustom ? 12 : { base: 12, sm: 6 }}>
              <GuardrailCard
                guardrailId={guardrail.id}
                isSelected={selectedGuardrails.includes(guardrail.id)}
                onToggle={onToggleGuardrail}
                customInstructions={isCustom ? customInstructions : undefined}
                onCustomInstructionsChange={isCustom ? onCustomInstructionsChange : undefined}
              />
            </Grid.Col>
          );
        })}
      </Grid>
    </Stack>
  )
}