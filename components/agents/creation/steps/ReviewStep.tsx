'use client'

import { Stack, Title, Text, Card, Group, Badge, Divider, Grid, Paper, Box, ThemeIcon, List } from '@mantine/core'
import { Bot, Settings, Zap, Shield, ArrowRight } from 'lucide-react'
import { StepProps } from '../forms/types'
import { INSTRUCTION_TEMPLATES, AI_MODELS } from '../shared/constants'

export function ReviewStep({ form }: StepProps) {
  const formData = form.getValues()
  
  // Get template info
  const selectedTemplate = formData.instructionTemplate 
    ? INSTRUCTION_TEMPLATES[formData.instructionTemplate as keyof typeof INSTRUCTION_TEMPLATES]
    : null
  
  // Get model info
  const selectedModel = AI_MODELS.find(model => model.value === formData.model)
  
  // Calculate configuration status
  const hasGuardrails = (formData.rules?.guardrails?.input?.length || 0) > 0 || (formData.rules?.guardrails?.output?.length || 0) > 0
  
  return (
    <Stack gap="lg">
      <Title order={3}>Review & Create Agent</Title>

      <Grid>
        <Grid.Col span={8}>
          {/* Agent Overview */}
          <Card withBorder radius="md" mb="md">
            <Group align="flex-start" gap="md">
              <ThemeIcon size="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                <Bot size={24} />
              </ThemeIcon>
              <Box flex={1}>
                <Title order={4} mb="xs">{formData.name}</Title>
                <Text c="dimmed" size="sm" mb="md">{formData.description}</Text>
                
                <Group gap="xs" mb="md">
                  {selectedTemplate && (
                    <Badge leftSection={selectedTemplate.icon} variant="light">
                      {selectedTemplate.title}
                    </Badge>
                  )}
                  <Badge leftSection={<Settings size={12} />} variant="outline">
                    {selectedModel?.label || formData.model}
                  </Badge>
                  <Badge leftSection={<Zap size={12} />} variant="outline">
                    Temp: {formData.temperature}
                  </Badge>
                </Group>
              </Box>
            </Group>
          </Card>

          {/* Configuration Details */}
          <Card withBorder radius="md" mb="md">
            <Title order={5} mb="md">Configuration Details</Title>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Model Settings</Text>
                <Group gap="xs">
                  <Text size="xs" c="dimmed">Temperature: {formData.temperature}</Text>
                  <Text size="xs" c="dimmed">Max Tokens: {formData.maxTokens}</Text>
                </Group>
              </Group>
              
              <Group justify="space-between">
                <Text size="sm" fw={500}>Output Configuration</Text>
                <Group gap="xs">
                  <Badge size="xs" variant="outline">
                    {formData.rules?.outputType || 'text'}
                  </Badge>
                  <Badge size="xs" variant="outline">
                    Tools: {formData.rules?.toolChoice || 'auto'}
                  </Badge>
                </Group>
              </Group>

              {formData.selectedIntegrations?.length > 0 && (
                <>
                  <Divider my="xs" />
                  <Text size="sm" fw={500} mb="xs">Active Integrations</Text>
                  <Stack gap="xs">
                    {formData.selectedIntegrations.map((integration, index) => (
                      <Box key={index}>
                        <Group gap="xs" mb="xs">
                          <Badge leftSection={<ArrowRight size={12} />} variant="light">
                            {integration.integrationId}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {integration.selectedTools?.length || 0} tools selected
                          </Text>
                        </Group>
                        {integration.selectedTools && integration.selectedTools.length > 0 && (
                          <Group gap="xs" ml="md">
                            {integration.selectedTools.map((tool, toolIndex) => (
                              <Badge key={toolIndex} size="xs" variant="outline" color="gray">
                                {tool}
                              </Badge>
                            ))}
                          </Group>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </Stack>
          </Card>

          {/* Security & Safety */}
          {hasGuardrails && (
            <Card withBorder radius="md">
              <Group align="center" gap="sm" mb="md">
                <ThemeIcon color="green" variant="light">
                  <Shield size={16} />
                </ThemeIcon>
                <Title order={5}>Security & Safety Measures</Title>
              </Group>
              <Grid>
                {formData.rules?.guardrails?.input && formData.rules.guardrails.input.length > 0 && (
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500} mb="xs">Input Filters</Text>
                    <List size="xs">
                      {formData.rules.guardrails.input.map((filter, index) => (
                        <List.Item key={index}>{filter}</List.Item>
                      ))}
                    </List>
                  </Grid.Col>
                )}
                {formData.rules?.guardrails?.output && formData.rules.guardrails.output.length > 0 && (
                  <Grid.Col span={6}>
                    <Text size="sm" fw={500} mb="xs">Output Filters</Text>
                    <List size="xs">
                      {formData.rules.guardrails.output.map((filter, index) => (
                        <List.Item key={index}>{filter}</List.Item>
                      ))}
                    </List>
                  </Grid.Col>
                )}
              </Grid>
            </Card>
          )}
        </Grid.Col>

        <Grid.Col span={4}>
          {/* Instructions Panel */}
          <Paper withBorder p="md" radius="md">
            <Group align="center" gap="sm" mb="md">
              <ThemeIcon color="blue" variant="light">
                <Bot size={16} />
              </ThemeIcon>
              <Title order={5}>Agent Instructions</Title>
            </Group>
            
            {selectedTemplate && (
              <>
                <Badge variant="light" mb="md" fullWidth>
                  Template: {selectedTemplate.title}
                </Badge>
                <Text size="sm" mb="md" c="dimmed">
                  {selectedTemplate.description}
                </Text>
                <Divider mb="md" />
              </>
            )}
            
            <Text size="sm" fw={500} mb="xs">System Prompt</Text>
            <Text 
              size="xs" 
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}
              c="dimmed"
            >
              {formData.systemPrompt || 'No custom instructions provided'}
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
