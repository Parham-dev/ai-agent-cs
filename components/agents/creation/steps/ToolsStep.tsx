'use client'

import { Stack, Title, Text } from '@mantine/core'
import { StepProps } from '../forms/types'

export function ToolsStep({ }: StepProps) {
  return (
    <Stack gap="lg">
      <Title order={3}>Tools & Capabilities</Title>
      <Text c="dimmed">
        This step will contain tool selection and configuration.
      </Text>
      {/* TODO: Implement actual form fields */}
    </Stack>
  )
}
