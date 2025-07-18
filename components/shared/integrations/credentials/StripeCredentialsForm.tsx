'use client'

import { useState, useEffect } from 'react'
import {
  Stack,
  TextInput,
  Button,
  Group,
  Text,
  Alert,
  Anchor,
  LoadingOverlay,
  Select,
  Grid,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import type { ApiIntegration } from '@/lib/types'

interface StripeCredentialsFormProps {
  integration?: ApiIntegration | null
  onSave: (integration: ApiIntegration) => void
  onCancel: () => void
}

interface StripeCredentials {
  publishableKey: string
  secretKey: string
  webhookSecret?: string
  environment: 'test' | 'live'
}

export function StripeCredentialsForm({ 
  integration, 
  onSave, 
  onCancel 
}: StripeCredentialsFormProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const form = useForm<StripeCredentials>({
    initialValues: {
      publishableKey: '',
      secretKey: '',
      webhookSecret: '',
      environment: 'test'
    },
    validate: {
      publishableKey: (value) => {
        if (!value.trim()) return 'Publishable key is required'
        if (!value.startsWith('pk_')) return 'Publishable key must start with pk_'
        return null
      },
      secretKey: (value) => {
        if (!value.trim()) return 'Secret key is required'
        if (!value.startsWith('sk_')) return 'Secret key must start with sk_'
        return null
      }
    },
    onValuesChange: () => {
      // Reset connection status when form values change
      if (testResult === 'success') {
        setTestResult(null)
      }
    }
  })

  // Load existing credentials if integration exists
  useEffect(() => {
    if (integration?.credentials) {
      const creds = integration.credentials as unknown as StripeCredentials
      form.setValues({
        publishableKey: creds.publishableKey || '',
        secretKey: creds.secretKey || '',
        webhookSecret: creds.webhookSecret || '',
        environment: creds.environment || 'test'
      })
      // If we have existing credentials, assume they're valid
      if (creds.publishableKey && creds.secretKey) {
        setTestResult('success')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integration])

  const testConnection = async () => {
    const validation = form.validate()
    if (validation.hasErrors) return

    try {
      setTesting(true)
      setTestResult(null)
      
      const values = form.getValues()
      
      // Test the connection using the API endpoint
      const response = await fetch('/api/v2/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'stripe',
          credentials: {
            secretKey: values.secretKey.trim()
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setTestResult('success')
        toast.success(`Connection successful! Connected to ${result.businessName || 'your Stripe account'}`)
      } else {
        setTestResult('error')
        toast.error(result.error || 'Connection test failed. Please check your credentials.')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setTestResult('error')
      toast.error('Connection test failed. Please check your credentials.')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async (values: StripeCredentials) => {
    try {
      setLoading(true)
      
      const credentials = {
        publishableKey: values.publishableKey.trim(),
        secretKey: values.secretKey.trim(),
        webhookSecret: values.webhookSecret?.trim() || undefined,
        environment: values.environment
      }

      let savedIntegration: ApiIntegration

      if (integration?.id && !integration.id.startsWith('temp-')) {
        // Update existing integration
        savedIntegration = await apiClient.updateIntegration(integration.id, {
          credentials
        })
      } else {
        // Create new integration
        savedIntegration = await apiClient.createIntegration({
          name: 'Stripe',
          type: 'stripe',
          credentials
        })
      }

      toast.success('Stripe credentials saved successfully!')
      onSave(savedIntegration)
    } catch (error) {
      console.error('Failed to save credentials:', error)
      toast.error('Failed to save credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="lg">
      <LoadingOverlay visible={loading} />
      
      <Stack gap="sm">
        <Text fw={500} size="lg">Stripe Integration Settings</Text>
        <Text size="sm" c="dimmed">
          Connect your Stripe account to enable payment processing and subscription tools.
        </Text>
      </Stack>

      <Grid>
        {/* Left Column - Form Fields */}
        <Grid.Col span={8}>
          <form onSubmit={form.onSubmit(handleSave)}>
            <Stack gap="md">
              <Select
                label="Environment"
                description="Select whether you're using test or live keys"
                required
                data={[
                  { value: 'test', label: 'Test (Development)' },
                  { value: 'live', label: 'Live (Production)' }
                ]}
                {...form.getInputProps('environment')}
              />

              <TextInput
                label="Publishable Key"
                placeholder="pk_test_... or pk_live_..."
                description="Your Stripe publishable key (safe to use in client-side code)"
                required
                {...form.getInputProps('publishableKey')}
              />

              <TextInput
                label="Secret Key"
                placeholder="sk_test_... or sk_live_..."
                description="Your Stripe secret key (keep this secure)"
                required
                type="password"
                {...form.getInputProps('secretKey')}
              />

              <TextInput
                label="Webhook Secret (Optional)"
                placeholder="whsec_..."
                description="Webhook endpoint secret for secure event verification"
                type="password"
                {...form.getInputProps('webhookSecret')}
              />

              {testResult === 'success' && (
                <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
                  Connection test successful! Your Stripe account is connected.
                </Alert>
              )}

              {testResult === 'error' && (
                <Alert icon={<AlertCircle size={16} />} color="red" variant="light">
                  Connection test failed. Please verify your credentials and try again.
                </Alert>
              )}

              <Group justify="space-between" pt="md">
                <Button
                  variant="outline"
                  onClick={testConnection}
                  loading={testing}
                  disabled={loading || testResult === 'success'}
                  color={testResult === 'success' ? 'green' : undefined}
                >
                  {testResult === 'success' ? 'Connected' : 'Connect'}
                </Button>
                
                <Group gap="sm">
                  <Button
                    variant="subtle"
                    onClick={onCancel}
                    disabled={loading || testing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={testing || testResult !== 'success'}
                  >
                    Save Configuration
                  </Button>
                </Group>
              </Group>
            </Stack>
          </form>
        </Grid.Col>

        {/* Right Column - Documentation */}
        <Grid.Col span={4}>
          <Alert icon={<AlertCircle size={16} />} color="blue" variant="light">
            <Stack gap="xs">
              <Text size="sm" fw={500}>Need help finding your API keys?</Text>
              <Text size="sm">
                You can find your API keys in the Stripe Dashboard under Developers → API keys.
              </Text>
              <Group gap="xs" align="center">
                <Anchor 
                  href="https://dashboard.stripe.com/apikeys" 
                  target="_blank"
                  size="sm"
                >
                  View Stripe Dashboard
                </Anchor>
                <ExternalLink size={12} />
              </Group>
            </Stack>
          </Alert>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
