'use client'

import { 
  Stack, 
  Title, 
  TextInput, 
  Textarea, 
  Select, 
  Grid, 
  Card, 
  Text,
  Group,
  Divider
} from '@mantine/core'
import { StepProps } from '../forms/types'
import { INSTRUCTION_TEMPLATES, AI_MODELS, OUTPUT_TYPE_OPTIONS, TOOL_CHOICE_OPTIONS } from '../shared/constants'

export function BasicInfoStep({ form }: StepProps) {
  const selectedTemplate = form.values.instructionTemplate

  const handleTemplateSelect = (templateId: string) => {
    const template = INSTRUCTION_TEMPLATES[templateId as keyof typeof INSTRUCTION_TEMPLATES]
    if (template) {
      form.setFieldValue('instructionTemplate', templateId)
      if (template.instructions) {
        form.setFieldValue('systemPrompt', template.instructions)
      }
    }
  }

  const templateEntries = Object.entries(INSTRUCTION_TEMPLATES)

  return (
    <Stack gap="lg">
      <Title order={3}>Basic Information</Title>
      
      {/* Agent Name and Description */}
      <Grid>
        <Grid.Col span={8}>
          <TextInput
            label="Agent Name"
            placeholder="Enter agent name"
            required
            {...form.getInputProps('name')}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <Select
            label="AI Model"
            placeholder="Select AI model"
            required
            data={AI_MODELS}
            {...form.getInputProps('model')}
          />
        </Grid.Col>
      </Grid>

      <Textarea
        label="Description"
        placeholder="Describe what this agent does"
        rows={3}
        {...form.getInputProps('description')}
      />

      {/* Instruction Templates */}
      <Stack gap="sm">
        <Text fw={500}>Choose a Template</Text>
        <Grid>
          {templateEntries.map(([templateId, template]) => (
            <Grid.Col span={6} key={templateId}>
              <Card
                p="md"
                withBorder
                className={`cursor-pointer transition-all ${
                  selectedTemplate === templateId 
                    ? template.color 
                    : `${template.borderColor} hover:border-gray-300`
                }`}
                onClick={() => handleTemplateSelect(templateId)}
              >
                <Group gap="sm">
                  {template.icon}
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Text fw={500} size="sm">{template.title}</Text>
                    <Text size="xs" c="dimmed">{template.description}</Text>
                  </Stack>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>

      {/* Custom Instructions */}
      <Textarea
        label="System Prompt"
        placeholder="Enter custom instructions for your agent"
        autosize
        minRows={4}
        maxRows={12}
        required
        styles={{
          input: {
            padding: '20px',
            lineHeight: '1.6',
            resize: 'none'
          }
        }}
        {...form.getInputProps('systemPrompt')}
      />

      <Divider />

      {/* Behavior Settings */}
      <Title order={4}>Behavior Settings</Title>
      <Grid>
        <Grid.Col span={6}>
          <Select
            label="Output Type"
            data={OUTPUT_TYPE_OPTIONS}
            {...form.getInputProps('rules.outputType')}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <Select
            label="Tool Choice"
            data={TOOL_CHOICE_OPTIONS}
            {...form.getInputProps('rules.toolChoice')}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
