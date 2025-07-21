'use client'

import {
  Stack,
  Alert,
  Paper,
  Group,
  Text,
  CopyButton,
  ActionIcon,
  Tooltip,
  Code,
  Checkbox,
  Badge
} from '@mantine/core'
import { AlertCircle, Copy, Check } from 'lucide-react'
import { widgetCodeGenerator, type WidgetCodeOptions } from '@/lib/utils/widget-code-generator'

interface WidgetCodeSnippetsTabProps {
  codeOptions: WidgetCodeOptions
}

export function WidgetCodeSnippetsTab({ codeOptions }: WidgetCodeSnippetsTabProps) {
  const snippets = widgetCodeGenerator.generateSnippets(codeOptions)
  const checklist = widgetCodeGenerator.generateChecklist()

  return (
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
  )
}