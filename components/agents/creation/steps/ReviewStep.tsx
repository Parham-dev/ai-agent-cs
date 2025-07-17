'use client'

import { Stack, Title, Text } from '@mantine/core'
import { StepProps } from '../forms/types'

export function ReviewStep({ }: StepProps) {
  return (
    <Stack gap="lg">
      <Title order={3}>Review & Create</Title>
      <Text c="dimmed">
        This step will contain a review of all settings before creating the agent.
      </Text>
      {/* TODO: Implement actual review content */}
    </Stack>
  )
}
