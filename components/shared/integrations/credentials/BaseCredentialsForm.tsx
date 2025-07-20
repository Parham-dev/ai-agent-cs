'use client'

import { useState, useEffect, useMemo, ReactNode } from 'react'
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
import { api } from '@/lib/api'
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
  testConnection: (credentials: Record<string, string>) => Promise<boolean>
}

interface BaseCredentialsFormProps {
  config: BaseCredentialsConfig
  integration?: ApiIntegration | null
  onSaved?: (integration: ApiIntegration) => Promise<void> | void
  tempIntegrationId?: string
}

export function BaseCredentialsForm({
  config,
  integration,
  onSaved
}: BaseCredentialsFormProps) {
  const [loading, setLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [fieldsChanged, setFieldsChanged] = useState(false)

  // Memoize initial values to prevent form recreation
  const initialValues = useMemo(() => {
    return config.fields.reduce((acc, field) => {
      acc[field.key] = (integration?.credentials?.[field.key] as string) || ''
      return acc
    }, {} as Record<string, string>)
  }, [config.fields, integration?.credentials])

  // Memoize validation schema to prevent recreation
  const validationSchema = useMemo(() => {
    return config.fields.reduce((acc, field) => {
      if (field.validate) {
        acc[field.key] = field.validate
      }
      return acc
    }, {} as Record<string, (value: string) => string | null>)
  }, [config.fields])

  // Initialize form with memoized values
  const form = useForm({
    mode: 'controlled',
    initialValues,
    validate: validationSchema,
    onValuesChange: () => {
      // Mark fields as changed when user modifies values
      if (testStatus === 'success') {
        setFieldsChanged(true)
        setTestStatus('idle') // Reset connection status when fields change
      }
    }
  })

  const isEditing = integration && !integration.id.startsWith('temp-')  // Update form when integration credentials change
  useEffect(() => {
    if (integration?.credentials) {
      config.fields.forEach(field => {
        const newValue = (integration.credentials[field.key] as string) || ''
        form.setFieldValue(field.key, newValue)
      })
      // If we have existing credentials, assume they were previously connected
      if (isEditing) {
        setTestStatus('success')
        setFieldsChanged(false)
      }
    } else {
      // Reset status for new integrations
      setTestStatus('idle')
      setFieldsChanged(false)
    }
    // form is intentionally excluded from dependencies as it's a stable object from useForm
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integration?.credentials, config.fields, isEditing])

  const handleTestConnection = async () => {
    setTestStatus('testing')
    setFieldsChanged(false) // Reset the changed flag since we're testing current values
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
    setLoading(true)
    try {
      let savedIntegration: ApiIntegration

      if (integration?.id && !integration.id.startsWith('temp-')) {
        // Update existing integration
        savedIntegration = await api.integrations.updateIntegration(integration.id, {
          credentials: values
        })
      } else {
        // Create new integration - organizationId will be auto-extracted from JWT
        savedIntegration = await api.integrations.createIntegration({
          name: config.displayName,
          type: config.type,
          credentials: values
        })
      }

      // Reset states after successful save but before calling parent
      setTestStatus('idle')
      setFieldsChanged(false)

      // Call parent handler and wait for it to complete
      if (onSaved) {
        await onSaved(savedIntegration)
      }
      
    } catch (error) {
      console.error(`Failed to save ${config.displayName} credentials:`, error)
      toast.error(`Failed to save ${config.displayName} credentials`)
    } finally {
      setLoading(false)
    }
  }

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
                <Text size="xs" c="dimmed" mt={4}>
                  {field.description}
                </Text>
              )}
            </Grid.Col>
          ))}
        </Grid>

        <Group justify="space-between" align="center">
          <Group>
            <Button
              variant={testStatus === 'success' && !fieldsChanged ? "filled" : "outline"}
              onClick={handleTestConnection}
              loading={testStatus === 'testing'}
              disabled={loading || (testStatus === 'success' && !fieldsChanged)}
              color={testStatus === 'success' && !fieldsChanged ? "green" : "blue"}
            >
              {testStatus === 'success' && <CheckCircle size={16} />}
              {testStatus === 'error' && <AlertCircle size={16} />}
              {testStatus === 'success' && !fieldsChanged ? 'Connected' : 'Connect'}
            </Button>
            
            <Button 
              type="submit" 
              loading={loading}
              disabled={testStatus !== 'success' || fieldsChanged}
            >
              {isEditing ? 'Update Configuration' : 'Save Configuration'}
            </Button>
          </Group>

          {testStatus === 'success' && (
            <Group>
              <CheckCircle size={16} />
              <Text size="sm" c="green">Connected successfully</Text>
            </Group>
          )}
          
          {testStatus === 'error' && (
            <Group>
              <AlertCircle size={16} />
              <Text size="sm" c="red">Connection failed</Text>
            </Group>
          )}
        </Group>
      </Stack>
    </form>
  )
}