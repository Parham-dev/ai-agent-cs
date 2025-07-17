'use client'

import { Stack, Title, Text } from '@mantine/core'
import { StepProps } from '../forms/types'

export function AdvancedStep({ }: StepProps) {
  return (
    <Stack gap="lg">
      <Title order={3}>Advanced Settings</Title>
      <Text c="dimmed">
        This step will contain advanced configuration, guardrails, and handoffs.
      </Text>
      {/* TODO: Implement actual form fields */}
    </Stack>
  )
}
