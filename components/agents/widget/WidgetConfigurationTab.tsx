'use client'

import { useState } from 'react'
import {
  Stack,
  Grid,
  Select,
  ColorInput,
  TextInput,
  Switch,
  Divider,
  Group,
  Button
} from '@mantine/core'
import { UseFormReturnType } from '@mantine/form'
import { DomainManager } from './DomainManager'
import type { WidgetConfigForm } from '@/hooks/useWidgetConfig'

interface WidgetConfigurationTabProps {
  form: UseFormReturnType<WidgetConfigForm>
  onSave: () => Promise<boolean>
}

export function WidgetConfigurationTab({ form, onSave }: WidgetConfigurationTabProps) {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave()
    setSaving(false)
  }

  return (
    <Stack gap="lg">
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Position"
            description="Where to display the widget on the page"
            data={[
              { value: 'bottom-right', label: 'Bottom Right' },
              { value: 'bottom-left', label: 'Bottom Left' }
            ]}
            {...form.getInputProps('position')}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Select
            label="Theme"
            description="Widget color scheme"
            data={[
              { value: 'auto', label: 'Auto (follows system)' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' }
            ]}
            {...form.getInputProps('theme')}
          />
        </Grid.Col>
      </Grid>

      <ColorInput
        label="Primary Color"
        description="Main color for buttons and accents"
        placeholder="#007bff"
        {...form.getInputProps('primaryColor')}
      />

      <TextInput
        label="Greeting Message"
        description="Custom welcome message (optional)"
        placeholder="Hello! How can I help you today?"
        {...form.getInputProps('greeting')}
      />

      <TextInput
        label="Input Placeholder"
        description="Placeholder text for the message input"
        {...form.getInputProps('placeholder')}
      />

      <Switch
        label="Show 'Powered by' footer"
        description="Display attribution in the widget"
        {...form.getInputProps('showPoweredBy', { type: 'checkbox' })}
      />

      <Divider />

      <DomainManager
        domains={form.values.allowedDomains}
        onDomainsChange={(domains) => form.setFieldValue('allowedDomains', domains)}
      />

      <Group justify="flex-end" pt="md">
        <Button onClick={handleSave} loading={saving}>
          Save Configuration
        </Button>
      </Group>
    </Stack>
  )
}