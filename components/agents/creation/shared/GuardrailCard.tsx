'use client'

import {
  Card,
  Group,
  Text,
  Switch,
  Badge,
  Stack,
  Textarea,
  Collapse,
} from '@mantine/core'
import { Shield, CheckCircle, AlertTriangle, Zap } from 'lucide-react'
import { AVAILABLE_GUARDRAILS } from '@/lib/guardrails'

interface GuardrailCardProps {
  guardrailId: string
  isSelected: boolean
  onToggle: (guardrailId: string) => void
  customInstructions?: string
  onCustomInstructionsChange?: (instructions: string) => void
}

function getGuardrailIcon(category: string) {
  switch (category) {
    case 'safety':
      return Shield
    case 'quality':
      return CheckCircle
    case 'compliance':
      return AlertTriangle
    case 'performance':
      return Zap
    default:
      return Shield
  }
}

function getGuardrailColors(category: string) {
  switch (category) {
    case 'safety':
      return {
        color: 'red',
        bg: 'bg-red-50'
      }
    case 'quality':
      return {
        color: 'blue',
        bg: 'bg-blue-50'
      }
    case 'compliance':
      return {
        color: 'orange',
        bg: 'bg-orange-50'
      }
    case 'performance':
      return {
        color: 'green',
        bg: 'bg-green-50'
      }
    default:
      return {
        color: 'gray',
        bg: 'bg-gray-50'
      }
  }
}

function getGuardrailDescription(guardrailId: string): string {
  switch (guardrailId) {
    case 'content-safety':
      return 'Blocks inappropriate, toxic, or harmful content'
    case 'privacy-protection':
      return 'Detects and blocks personally identifiable information (PII)'
    case 'professional-tone':
      return 'Ensures responses maintain professional and appropriate tone'
    case 'factual-accuracy':
      return 'Validates for factual correctness & appropriate uncertainty'
    case 'custom-input':
      return 'Apply custom validation rules to user input'
    case 'custom-output':
      return 'Apply custom validation rules to agent responses'
    default:
      return 'Provides additional safety and quality checks'
  }
}

export function GuardrailCard({
  guardrailId,
  isSelected,
  onToggle,
  customInstructions = '',
  onCustomInstructionsChange
}: GuardrailCardProps) {
  const guardrail = AVAILABLE_GUARDRAILS.find(g => g.id === guardrailId)
  
  if (!guardrail) {
    return null
  }
  
  const Icon = getGuardrailIcon(guardrail.category)
  const colors = getGuardrailColors(guardrail.category)
  const description = getGuardrailDescription(guardrailId)
  const isCustom = guardrailId === 'custom-input' || guardrailId === 'custom-output'

  return (
    <Card
      withBorder
      p="md"
      className={`transition-all ${isSelected ? colors.bg : ''}`}
    >
      <Group justify="space-between" align="flex-start">
        <Group gap="md">
          <Icon size={24} />
          <Stack gap={2}>
            <Group gap="xs">
              <Text fw={500} size="sm">{guardrail.name}</Text>
              <Badge size="xs" color={colors.color} variant="light">
                {guardrail.category}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          </Stack>
        </Group>

        <Switch
          size="sm"
          checked={isSelected}
          onChange={() => onToggle(guardrailId)}
        />
      </Group>
      
      {/* Custom Instructions Section */}
      {isCustom && (
        <Collapse in={isSelected}>
          <Stack gap="sm" mt="md">
            <Text size="xs" fw={500}>
              Custom Instructions
            </Text>
            <Textarea
              placeholder={`Enter your custom ${guardrailId === 'custom-input' ? 'input' : 'output'} validation rules...`}
              value={customInstructions}
              onChange={(e) => onCustomInstructionsChange?.(e.currentTarget.value)}
              minRows={5}
              maxRows={10}
              size="sm"
              autosize
            />
            <Text size="xs" c="dimmed">
              Describe what content should be blocked or what requirements must be met.
            </Text>
          </Stack>
        </Collapse>
      )}
    </Card>
  )
}