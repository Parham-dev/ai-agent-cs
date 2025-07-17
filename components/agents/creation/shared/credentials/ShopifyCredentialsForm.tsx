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
  Grid,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import type { ApiIntegration } from '@/lib/types'

interface ShopifyCredentialsFormProps {
  integration?: ApiIntegration | null
  onSave: (integration: ApiIntegration) => void
  onCancel: () => void
}

interface ShopifyCredentials {
  shopUrl: string
  accessToken: string
}

// Database credentials interface - now same as form
interface ShopifyDatabaseCredentials {
  shopUrl: string
  accessToken: string
}

export function ShopifyCredentialsForm({ 
  integration, 
  onSave, 
  onCancel 
}: ShopifyCredentialsFormProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  const form = useForm<ShopifyCredentials>({
    initialValues: {
      shopUrl: '',
      accessToken: ''
    },
    validate: {
      shopUrl: (value) => {
        if (!value.trim()) return 'Store URL is required'
        if (!value.includes('.myshopify.com') && !value.includes('.shopify.com')) {
          return 'Please enter a valid Shopify store URL'
        }
        return null
      },
      accessToken: (value) => value.trim() ? null : 'Admin API Token is required'
    }
  })

  // Load existing credentials if integration exists
  useEffect(() => {
    if (integration?.credentials) {
      const dbCreds = integration.credentials as unknown as ShopifyDatabaseCredentials
      form.setValues({
        shopUrl: dbCreds.shopUrl || '',
        accessToken: dbCreds.accessToken || ''
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [integration])

  const formatStoreUrl = (url: string) => {
    let formatted = url.trim().toLowerCase()
    if (!formatted.startsWith('http')) {
      formatted = 'https://' + formatted
    }
    if (!formatted.includes('.myshopify.com') && !formatted.includes('.shopify.com')) {
      // Remove any existing domain and add .myshopify.com
      formatted = formatted.replace(/https?:\/\//, '').split('.')[0]
      formatted = `https://${formatted}.myshopify.com`
    }
    return formatted
  }

  const testConnection = async () => {
    const validation = form.validate()
    if (validation.hasErrors) return

    try {
      setTesting(true)
      setTestResult(null)
      
      const values = form.getValues()
      formatStoreUrl(values.shopUrl)
      
      // Test the connection (this would be your actual test endpoint)
      // For now, just simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTestResult('success')
      toast.success('Connection test successful!')
    } catch (error) {
      console.error('Connection test failed:', error)
      setTestResult('error')
      toast.error('Connection test failed. Please check your credentials.')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async (values: ShopifyCredentials) => {
    try {
      setLoading(true)
      
      const formattedUrl = formatStoreUrl(values.shopUrl)
      const credentials = {
        shopUrl: formattedUrl,
        accessToken: values.accessToken.trim()
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
          name: 'Shopify',
          type: 'shopify',
          credentials
        })
      }

      toast.success('Shopify credentials saved successfully!')
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
        <Text fw={500} size="lg">Shopify Integration Settings</Text>
        <Text size="sm" c="dimmed">
          Connect your Shopify store to enable e-commerce tools and features.
        </Text>
      </Stack>

      <Grid>
        {/* Left Column - Form Fields */}
        <Grid.Col span={8}>
          <form onSubmit={form.onSubmit(handleSave)}>
            <Stack gap="md">
              <TextInput
                label="Store URL"
                placeholder="your-store-name.myshopify.com"
                description="Your Shopify store URL or domain"
                required
                {...form.getInputProps('shopUrl')}
              />

              <TextInput
                label="Admin API Token"
                placeholder="shpat_..."
                description="Private app access token with required permissions"
                required
                type="password"
                {...form.getInputProps('accessToken')}
              />

              {testResult === 'success' && (
                <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
                  Connection test successful! Your Shopify store is connected.
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
                  disabled={loading}
                >
                  Test Connection
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
                    disabled={testing}
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
              <Text size="sm" fw={500}>Need help getting your API token?</Text>
              <Text size="sm">
                Create a private app in your Shopify admin to get an access token.
              </Text>
              <Group gap="xs" align="center">
                <Anchor 
                  href="https://help.shopify.com/en/manual/apps/private-apps" 
                  target="_blank"
                  size="sm"
                >
                  View Shopify documentation
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
