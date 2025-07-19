'use client'

import { useState, useEffect, ReactNode } from 'react'
import {
  Stack,
  TextInput,
  Button,
  Group,
  Text,
  Alert,
  LoadingOverlay,
  Select,
  Grid,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthContext } from '@/components/providers'
import { apiClient } from '@/lib/api/client'
import type { ApiIntegration } from '@/lib/types'

interface BaseCredentialsConfig {
  type: 'shopify' | 'stripe'
  displayName: string
  fields: Array<{
    key: string
    label: string
    type: 'text' | 'password' | 'select'
    placeholder?: string
    description?: ReactNode
    options?: Array<{ label: string; value: string }>
    validate?: (value: string) => string | null
  }>
  helpText?: ReactNode
  testConnection?: (credentials: Record<string, string>) => Promise<boolean>
}

interface BaseCredentialsFormProps {
  config: BaseCredentialsConfig
  integration?: ApiIntegration | null
  onSaved?: (integration: ApiIntegration) => void
  tempIntegrationId?: string
}

export function BaseCredentialsForm({
  config,
  integration,
  onSaved
}: BaseCredentialsFormProps) {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  // Initialize form with existing credentials
  const form = useForm({
    initialValues: config.fields.reduce((acc, field) => {
      acc[field.key] = (integration?.credentials?.[field.key] as string) || ''
      return acc
    }, {} as Record<string, string>),
    validate: config.fields.reduce((acc, field) => {
      if (field.validate) {
        acc[field.key] = field.validate
      }
      return acc
    }, {} as Record<string, (value: string) => string | null>)
  })

  // Update form when integration changes
  useEffect(() => {
    if (integration?.credentials) {
      config.fields.forEach(field => {
        form.setFieldValue(field.key, (integration.credentials[field.key] as string) || '')
      })
    }
  }, [integration, config.fields, form])

  const handleTestConnection = async () => {
    if (!config.testConnection) return

    setTestStatus('testing')
    try {
      const success = await config.testConnection(form.values)
      setTestStatus(success ? 'success' : 'error')
      if (success) {
        toast.success(`${config.displayName} connection successful!`)
      } else {
        toast.error(`${config.displayName} connection failed. Please check your credentials.`)
      }
    } catch {
      setTestStatus('error')
      toast.error('Connection test failed')
    }
  }

  const handleSubmit = async (values: Record<string, string>) => {
    if (!user?.organizationId) {
      toast.error('Organization ID is required')
      return
    }

    setLoading(true)
    try {
      let savedIntegration: ApiIntegration

      if (integration?.id && !integration.id.startsWith('temp-')) {
        // Update existing integration
        savedIntegration = await apiClient.updateIntegration(integration.id, {
          credentials: values
        })
        toast.success(`${config.displayName} credentials updated successfully!`)
      } else {
        // Create new integration
        savedIntegration = await apiClient.createIntegration({
          name: config.displayName,
          type: config.type,
          credentials: values,
          organizationId: user.organizationId
        })
        toast.success(`${config.displayName} integration created successfully!`)
      }

      onSaved?.(savedIntegration)
      setTestStatus('idle')
    } catch (error) {
      console.error(`Failed to save ${config.displayName} credentials:`, error)
      toast.error(`Failed to save ${config.displayName} credentials`)
    } finally {
      setLoading(false)
    }
  }

  const isEditing = integration && !integration.id.startsWith('temp-')

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <LoadingOverlay visible={loading} />
      
      <Stack gap="md">
        <Text size="lg" fw={600}>
          {isEditing ? `Update ${config.displayName}` : `Connect ${config.displayName}`}
        </Text>

        {config.helpText && (
          <Alert variant="light" icon={<AlertCircle size={16} />}>
            {config.helpText}
          </Alert>
        )}

        <Grid>
          {config.fields.map(field => (
            <Grid.Col span={12} key={field.key}>
              {field.type === 'select' ? (
                <Select
                  label={field.label}
                  placeholder={field.placeholder}
                  data={field.options || []}
                  {...form.getInputProps(field.key)}
                />
              ) : (
                <TextInput
                  label={field.label}
                  placeholder={field.placeholder}
                  type={field.type}
                  {...form.getInputProps(field.key)}
                />
              )}
              {field.description && (
                <Text size="xs" color="dimmed" mt={4}>
                  {field.description}
                </Text>
              )}
            </Grid.Col>
          ))}
        </Grid>

        <Group justify="space-between" align="center">
          <Group>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Update' : 'Save'} Credentials
            </Button>
            
            {config.testConnection && (
              <Button
                variant="outline"
                onClick={handleTestConnection}
                loading={testStatus === 'testing'}
              >
                {testStatus === 'success' && <CheckCircle size={16} />}
                {testStatus === 'error' && <AlertCircle size={16} />}
                Test Connection
              </Button>
            )}
          </Group>

          {testStatus === 'success' && (
            <Group>
              <CheckCircle size={16} />
              <Text size="sm">Connected successfully</Text>
            </Group>
          )}
        </Group>
      </Stack>
    </form>
  )
}