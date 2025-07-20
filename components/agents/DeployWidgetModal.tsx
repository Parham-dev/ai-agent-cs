'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Title,
  Text,
  Tabs,
  Code,
  Button,
  Group,
  Paper,
  CopyButton,
  ActionIcon,
  Tooltip,
  Alert,
  TextInput,
  Switch,
  ColorInput,
  Select,
  Grid,
  Divider,
  Badge,
  Box,
  Checkbox,
  rem
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  Copy, 
  Check, 
  Code2, 
  Palette, 
  Settings, 
  ExternalLink,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { widgetCodeGenerator, type WidgetCodeOptions } from '@/lib/utils/widget-code-generator'
import type { Agent } from '@/lib/types/database'
import { tokenProvider } from '@/lib/api/base/token-provider'
import useSWR from 'swr'

interface DeployWidgetModalProps {
  opened: boolean
  onClose: () => void
  agent: Agent
}

interface WidgetConfigForm {
  position: string
  theme: string
  primaryColor: string
  greeting: string
  placeholder: string
  showPoweredBy: boolean
  allowedDomains: string[]
  domainInput: string
}

export function DeployWidgetModal({ opened, onClose, agent }: DeployWidgetModalProps) {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('basic')

  const form = useForm<WidgetConfigForm>({
    initialValues: {
      position: 'bottom-right',
      theme: 'auto',
      primaryColor: '#007bff',
      greeting: '',
      placeholder: 'Type your message...',
      showPoweredBy: true,
      allowedDomains: ['*'],
      domainInput: ''
    }
  })

  // Widget config fetcher with authentication
  const widgetConfigFetcher = async (url: string) => {
    const token = await tokenProvider.getToken()
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token || ''}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        // No config exists yet, return null (not an error)
        return null
      }
      throw new Error(`Failed to fetch widget config: ${response.status}`)
    }
    
    const result = await response.json()
    return result.data
  }

  // Use SWR to fetch widget config
  const { data: widgetConfig, error: configError, mutate: refreshConfig } = useSWR(
    opened && agent.id ? `/api/v2/widget/config/${agent.id}` : null,
    widgetConfigFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false, // Don't retry on 404
    }
  )

  // Update form when widget config loads
  useEffect(() => {
    if (widgetConfig) {
      form.setValues({
        position: widgetConfig.position,
        theme: widgetConfig.theme,
        primaryColor: widgetConfig.primaryColor,
        greeting: widgetConfig.greeting || '',
        placeholder: widgetConfig.placeholder,
        showPoweredBy: widgetConfig.showPoweredBy,
        allowedDomains: widgetConfig.allowedDomains,
        domainInput: ''
      })
    }
    // ESLint disable: form object is stable and we only want to run when widgetConfig changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetConfig])

  // Log any config errors (except 404 which is normal)
  useEffect(() => {
    if (configError) {
      console.error('Widget config error:', configError)
    }
  }, [configError])

  const saveWidgetConfig = async () => {
    try {
      setSaving(true)
      const configData = {
        agentId: agent.id,
        position: form.values.position,
        theme: form.values.theme,
        primaryColor: form.values.primaryColor,
        greeting: form.values.greeting || null,
        placeholder: form.values.placeholder,
        showPoweredBy: form.values.showPoweredBy,
        allowedDomains: form.values.allowedDomains,
        triggers: {},
        features: ['chat', 'typing-indicator']
      }

      const token = await tokenProvider.getToken()
      const response = await fetch('/api/v2/widget/config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Save failed with response:', errorText)
        throw new Error(`Failed to save widget configuration: ${response.status}`)
      }

      await response.json()
      
      // Refresh the SWR cache to get the updated config
      refreshConfig()
      
      notifications.show({
        title: 'Configuration Saved',
        message: 'Widget configuration has been saved successfully',
        color: 'green',
        icon: <CheckCircle size={rem(20)} />
      })
    } catch (error) {
      notifications.show({
        title: 'Save Failed',
        message: 'Failed to save widget configuration',
        color: 'red',
        icon: <AlertCircle size={rem(20)} />
      })
      console.error('Failed to save widget config:', error)
    } finally {
      setSaving(false)
    }
  }

  const addDomain = () => {
    const domain = form.values.domainInput.trim()
    if (domain && !form.values.allowedDomains.includes(domain)) {
      const newDomains = form.values.allowedDomains.filter(d => d !== '*').concat(domain)
      form.setFieldValue('allowedDomains', newDomains)
      form.setFieldValue('domainInput', '')
    }
  }

  const removeDomain = (domain: string) => {
    const newDomains = form.values.allowedDomains.filter(d => d !== domain)
    if (newDomains.length === 0) {
      newDomains.push('*')
    }
    form.setFieldValue('allowedDomains', newDomains)
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addDomain()
    }
  }

  const codeOptions: WidgetCodeOptions = {
    agentId: agent.id,
    config: {
      position: form.values.position,
      theme: form.values.theme,
      primaryColor: form.values.primaryColor,
      greeting: form.values.greeting || null,
      placeholder: form.values.placeholder,
      showPoweredBy: form.values.showPoweredBy
    }
  }

  const snippets = widgetCodeGenerator.generateSnippets(codeOptions)
  const checklist = widgetCodeGenerator.generateChecklist()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Stack gap={0}>
          <Title order={3}>Deploy Widget</Title>
          <Text size="sm" c="dimmed">Configure and deploy your AI customer service widget</Text>
        </Stack>
      }
      size="xl"
      padding="xl"
    >
      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'basic')}>
        <Tabs.List grow>
          <Tabs.Tab value="basic" leftSection={<Code2 size={16} />}>
            Code Snippets
          </Tabs.Tab>
          <Tabs.Tab value="config" leftSection={<Settings size={16} />}>
            Configuration
          </Tabs.Tab>
          <Tabs.Tab value="preview" leftSection={<Palette size={16} />}>
            Preview
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="basic" pt="lg">
          <Stack gap="lg">
            <Alert icon={<AlertCircle size={16} />} color="blue">
              Copy and paste one of these code snippets into your website before the closing &lt;/body&gt; tag.
            </Alert>

            {/* Basic Snippet */}
            <Paper withBorder p="md">
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Basic Installation</Text>
                <CopyButton value={snippets.basic}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied!' : 'Copy code'}>
                      <ActionIcon variant="light" onClick={copy} color={copied ? 'green' : 'blue'}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
              <Code block>{snippets.basic}</Code>
              <Text size="sm" c="dimmed" mt="sm">
                Simple one-line installation with default settings
              </Text>
            </Paper>

            {/* Advanced Snippet */}
            <Paper withBorder p="md">
              <Group justify="space-between" mb="sm">
                <Text fw={600}>Advanced Configuration</Text>
                <CopyButton value={snippets.advanced}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied!' : 'Copy code'}>
                      <ActionIcon variant="light" onClick={copy} color={copied ? 'green' : 'blue'}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
              <Code block>{snippets.advanced}</Code>
              <Text size="sm" c="dimmed" mt="sm">
                Full configuration with custom settings and triggers
              </Text>
            </Paper>

            {/* Implementation Checklist */}
            <Paper withBorder p="md">
              <Text fw={600} mb="md">Implementation Checklist</Text>
              <Stack gap="sm">
                {checklist.map((item, index) => (
                  <Group key={index} gap="sm">
                    <Checkbox size="sm" />
                    <Group gap="xs">
                      <Text size="sm">{item.task}</Text>
                      {item.required && <Badge size="xs" color="red">Required</Badge>}
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="config" pt="lg">
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

            <Stack gap="sm">
              <Text fw={600}>Allowed Domains</Text>
              <Text size="sm" c="dimmed">
                Domains where this widget is allowed to be embedded
              </Text>
              
              <Group>
                <TextInput
                  placeholder="example.com"
                  flex={1}
                  value={form.values.domainInput}
                  onChange={(e) => form.setFieldValue('domainInput', e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button onClick={addDomain} disabled={!form.values.domainInput.trim()}>
                  Add
                </Button>
              </Group>

              <Group gap="xs">
                {form.values.allowedDomains.map((domain) => (
                  <Badge
                    key={domain}
                    variant="light"
                    rightSection={
                      domain !== '*' ? (
                        <ActionIcon 
                          size="xs" 
                          color="red" 
                          variant="transparent"
                          onClick={() => removeDomain(domain)}
                        >
                          ×
                        </ActionIcon>
                      ) : undefined
                    }
                  >
                    {domain}
                  </Badge>
                ))}
              </Group>
            </Stack>

            <Group justify="flex-end" pt="md">
              <Button onClick={saveWidgetConfig} loading={saving}>
                Save Configuration
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="preview" pt="lg">
          <Stack gap="lg">
            <Alert icon={<AlertCircle size={16} />} color="blue">
              Live preview will be available after saving the configuration.
            </Alert>

            <Paper withBorder p="md">
              <Text fw={600} mb="md">Widget Preview</Text>
              <Box
                style={{
                  height: 400,
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  position: 'relative',
                  border: '1px dashed #dee2e6'
                }}
              >
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}
                >
                  <Text size="sm" c="dimmed">
                    Widget preview will appear here
                  </Text>
                  <Text size="xs" c="dimmed">
                    Save configuration to enable preview
                  </Text>
                </div>

                {/* Mock widget bubble */}
                <Box
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: form.values.position === 'bottom-right' ? '20px' : 'auto',
                    left: form.values.position === 'bottom-left' ? '20px' : 'auto',
                    width: '56px',
                    height: '56px',
                    backgroundColor: form.values.primaryColor,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer'
                  }}
                >
                  💬
                </Box>
              </Box>
            </Paper>

            <Paper withBorder p="md">
              <Text fw={600} mb="md">Test Your Widget</Text>
              <Group>
                <Button
                  variant="light"
                  leftSection={<ExternalLink size={16} />}
                  component="a"
                  href={`/widget/demo/${agent.id}`}
                  target="_blank"
                >
                  Open Test Page
                </Button>
                <Text size="sm" c="dimmed">
                  Test your widget in a new tab
                </Text>
              </Group>
            </Paper>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}