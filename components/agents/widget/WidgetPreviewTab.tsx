'use client'

import {
  Stack,
  Alert,
  Paper,
  Text,
  Box,
  Group,
  Button
} from '@mantine/core'
import { AlertCircle, ExternalLink } from 'lucide-react'
import type { Agent } from '@/lib/types/database'
import type { WidgetConfigForm } from '@/hooks/useWidgetConfig'

interface WidgetPreviewTabProps {
  agent: Agent
  formValues: WidgetConfigForm
}

export function WidgetPreviewTab({ agent, formValues }: WidgetPreviewTabProps) {
  return (
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
              right: formValues.position === 'bottom-right' ? '20px' : 'auto',
              left: formValues.position === 'bottom-left' ? '20px' : 'auto',
              width: '56px',
              height: '56px',
              backgroundColor: formValues.primaryColor,
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
  )
}