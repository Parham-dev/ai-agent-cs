'use client'

import { useState } from 'react'
import {
  Modal,
  Stack,
  Title,
  Text,
  Tabs
} from '@mantine/core'
import { Code2, Palette, Settings } from 'lucide-react'
import { WidgetCodeSnippetsTab } from './widget/WidgetCodeSnippetsTab'
import { WidgetConfigurationTab } from './widget/WidgetConfigurationTab'
import { WidgetPreviewTab } from './widget/WidgetPreviewTab'
import { useWidgetConfig } from '@/hooks/useWidgetConfig'
import type { Agent } from '@/lib/types/database'
import type { WidgetCodeOptions } from '@/lib/utils/widget-code-generator'

interface DeployWidgetModalProps {
  opened: boolean
  onClose: () => void
  agent: Agent
}

export function DeployWidgetModal({ opened, onClose, agent }: DeployWidgetModalProps) {
  const [activeTab, setActiveTab] = useState<string>('basic')
  const { form, saveWidgetConfig } = useWidgetConfig(agent, opened)

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
          <WidgetCodeSnippetsTab 
            codeOptions={codeOptions} 
          />
        </Tabs.Panel>

        <Tabs.Panel value="config" pt="lg">
          <WidgetConfigurationTab 
            form={form} 
            onSave={saveWidgetConfig} 
          />
        </Tabs.Panel>

        <Tabs.Panel value="preview" pt="lg">
          <WidgetPreviewTab 
            agent={agent} 
            formValues={form.values} 
          />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}