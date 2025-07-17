'use client'

import { Stack, Title, Text } from '@mantine/core'
import { StepProps } from '../forms/types'

export function IntegrationsStep({ }: StepProps) {
  return (
    <Stack gap="lg">
      <Title order={3}>Integrations</Title>
      <Text c="dimmed">
        This step will contain integration configuration and connected services.
      </Text>
      {/* TODO: Implement actual form fields */}
    </Stack>
  )
}
