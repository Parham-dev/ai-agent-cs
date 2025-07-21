import { useEffect } from 'react'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import useSWR from 'swr'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { rem } from '@mantine/core'
import { tokenProvider } from '@/lib/api/base/token-provider'
import type { WidgetConfig, Agent } from '@/lib/types/database'

export interface WidgetConfigForm {
  position: string
  theme: string
  primaryColor: string
  greeting: string
  placeholder: string
  showPoweredBy: boolean
  allowedDomains: string[]
  domainInput: string
}

const defaultFormValues: WidgetConfigForm = {
  position: 'bottom-right',
  theme: 'auto',
  primaryColor: '#007bff',
  greeting: '',
  placeholder: 'Type your message...',
  showPoweredBy: true,
  allowedDomains: ['*'],
  domainInput: ''
}

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

export function useWidgetConfig(agent: Agent | null, opened: boolean) {
  const form = useForm<WidgetConfigForm>({
    initialValues: defaultFormValues
  })

  // Use SWR to fetch widget config
  const { data: widgetConfig, error: configError, mutate: refreshConfig } = useSWR(
    opened && agent?.id ? `/api/v2/widget/config/${agent.id}` : null,
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

  const saveWidgetConfig = async (): Promise<boolean> => {
    if (!agent) return false
    
    try {
      const configData: Partial<WidgetConfig> = {
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
      
      return true
    } catch (error) {
      notifications.show({
        title: 'Save Failed',
        message: 'Failed to save widget configuration',
        color: 'red',
        icon: <AlertCircle size={rem(20)} />
      })
      console.error('Failed to save widget config:', error)
      return false
    }
  }

  return {
    form,
    widgetConfig,
    configError,
    saveWidgetConfig,
    refreshConfig
  }
}