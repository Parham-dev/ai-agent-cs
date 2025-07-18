'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/layout'
import {
  Badge,
  Button,
  Group,
  Stack,
  Text,
  Title,
  Paper,
  Grid,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
  Code,
  ThemeIcon,
  Box,
  Container
} from '@mantine/core'
import { 
  ArrowLeft, 
  Bot, 
  Edit, 
  Trash2, 
  Power, 
  MessageSquare, 
  Settings, 
  Copy,
  Calendar,
  Brain,
  Wrench,
  Plug
} from 'lucide-react'
import { apiClient } from '@/lib/api/authenticated-client'
import { AgentIntegrationsManager } from '@/components/agent-integrations'
import { toast } from 'sonner'
import type { ApiAgent } from '@/lib/types'

export default function AgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [agent, setAgent] = useState<ApiAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  const fetchAgent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const agentData = await apiClient.getAgent(agentId)
      setAgent(agentData)
    } catch (err) {
      console.error('Failed to fetch agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch agent')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  const handleToggleStatus = async () => {
    if (!agent) return
    
    try {
      setIsTogglingStatus(true)
      const updatedAgent = await apiClient.updateAgent(agent.id, { 
        isActive: !agent.isActive 
      })
      setAgent(updatedAgent)
      toast.success(`Agent ${updatedAgent.isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
      console.error('Failed to toggle agent status:', err)
      toast.error('Failed to update agent status')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!agent) return
    
    if (!confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await apiClient.deleteAgent(agent.id)
      toast.success('Agent deleted successfully')
      router.push('/agents')
    } catch (err) {
      console.error('Failed to delete agent:', err)
      toast.error('Failed to delete agent')
    }
  }

  const copyAgentId = () => {
    navigator.clipboard.writeText(agent?.id || '')
    toast.success('Agent ID copied to clipboard')
  }

  useEffect(() => {
    if (agentId) {
      fetchAgent()
    }
  }, [agentId, fetchAgent])

  if (loading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Fetching agent details">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </DashboardLayout>
    )
  }

  if (error || !agent) {
    return (
      <DashboardLayout title="Error" subtitle="Failed to load agent">
        <Center h={400}>
          <Stack align="center" gap="md">
            <ThemeIcon size={80} variant="light" color="gray">
              <Bot size={40} />
            </ThemeIcon>
            <Stack align="center" gap="xs">
              <Title order={3}>Agent not found</Title>
              <Text c="dimmed" ta="center">{error || 'The requested agent could not be found.'}</Text>
            </Stack>
            <Button 
              component={Link} 
              href="/agents"
              leftSection={<ArrowLeft size={16} />}
            >
              Back to Agents
            </Button>
          </Stack>
        </Center>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={agent?.name || 'Loading...'} 
      subtitle="Agent details and configuration"
    >
      <Container size="xl" px={0}>
        <Stack gap="xl">
          {/* Header */}
          <Paper p="lg" radius="lg" withBorder>
            <Group justify="space-between" wrap="nowrap">
              <Button 
                variant="subtle" 
                size="md" 
                component={Link} 
                href="/agents"
                leftSection={<ArrowLeft size={18} />}
                radius="md"
              >
                Back to Agents
              </Button>

              <Group gap="sm">
                <Button
                  variant="light"
                  size="md"
                  onClick={handleToggleStatus}
                  disabled={isTogglingStatus}
                  leftSection={<Power size={18} />}
                  color={agent.isActive ? "red" : "green"}
                  radius="md"
                >
                  {agent.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                
                <Button 
                  variant="light" 
                  size="md" 
                  component={Link} 
                  href={`/agents/${agent.id}/edit`}
                  leftSection={<Edit size={18} />}
                  radius="md"
                >
                  Edit
                </Button>
                
                <Button
                  variant="light"
                  size="md"
                  onClick={handleDelete}
                  color="red"
                  leftSection={<Trash2 size={18} />}
                  radius="md"
                >
                  Delete
                </Button>
              </Group>
            </Group>
          </Paper>

          {/* Main Content */}
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Stack gap="xl">
                {/* Agent Info */}
                <Paper withBorder radius="lg" p="xl">
                  <Group gap="md" mb="lg">
                    <ThemeIcon size="lg" variant="light" color="blue" radius="md">
                      <Bot size={22} />
                    </ThemeIcon>
                    <Title order={3} fw={600}>Agent Info</Title>
                  </Group>
                  <Grid gutter="lg">
                    <Grid.Col span={6}>
                      <Box>
                        <Text size="sm" fw={600} c="dimmed" mb="xs">Agent ID</Text>
                        <Group gap="sm">
                          <Code 
                            flex={1} 
                            p="sm"
                            style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {agent.id}
                          </Code>
                          <Tooltip label="Copy ID">
                            <ActionIcon variant="light" onClick={copyAgentId} radius="md">
                              <Copy size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Box>
                    </Grid.Col>
                    
                    <Grid.Col span={6}>
                      <Box>
                        <Text size="sm" fw={600} c="dimmed" mb="xs">Model</Text>
                        <Paper bg="var(--mantine-color-default-hover)" p="sm" radius="md" withBorder>
                          <Text ff="monospace" size="sm" fw={500}>{agent.model}</Text>
                        </Paper>
                      </Box>
                    </Grid.Col>

                    <Grid.Col span={6}>
                      <Box>
                        <Text size="sm" fw={600} c="dimmed" mb="xs">Status</Text>
                        <Badge 
                          size="lg"
                          color={agent.isActive ? "green" : "gray"} 
                          variant="light"
                          radius="md"
                        >
                          {agent.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Box>
                    </Grid.Col>

                    <Grid.Col span={6}>
                      <Box>
                        <Text size="sm" fw={600} c="dimmed" mb="xs">Integrations</Text>
                        <Paper bg="var(--mantine-color-default-hover)" p="sm" radius="md" withBorder>
                          <Text size="sm" fw={500}>
                            {agent.agentIntegrations?.length || 0}
                          </Text>
                        </Paper>
                      </Box>
                    </Grid.Col>
                  </Grid>
                </Paper>

                {/* Integrations */}
                <Paper withBorder radius="lg" p="xl">
                  <Group gap="md" mb="lg">
                    <ThemeIcon size="lg" variant="light" color="green" radius="md">
                      <Plug size={22} />
                    </ThemeIcon>
                    <Title order={3} fw={600}>Integrations</Title>
                  </Group>
                  {agent && <AgentIntegrationsManager agentId={agent.id} />}
                </Paper>

                {/* Tools */}
                <Paper withBorder radius="lg" p="xl">
                  <Group gap="md" mb="lg">
                    <ThemeIcon size="lg" variant="light" color="orange" radius="md">
                      <Wrench size={22} />
                    </ThemeIcon>
                    <Title order={3} fw={600}>Tools</Title>
                    <Badge variant="outline" size="md" radius="md">
                      0
                    </Badge>
                  </Group>
                  <Text c="dimmed" size="sm">Tools are now managed through integrations</Text>
                </Paper>
              </Stack>
            </Grid.Col>

            {/* Sidebar */}
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Stack gap="xl">
                {/* Quick Actions */}
                <Paper withBorder radius="lg" p="xl">
                  <Title order={3} fw={600} mb="lg">Quick Actions</Title>
                  <Stack gap="sm">
                    <Button 
                      variant="light" 
                      size="md" 
                      fullWidth 
                      justify="flex-start"
                      component={Link} 
                      href={`/chat/${agent.id}`}
                      target="_blank"
                      leftSection={<MessageSquare size={18} />}
                      radius="md"
                    >
                      Test Chat
                    </Button>
                    
                    <Button 
                      variant="light" 
                      size="md" 
                      fullWidth 
                      justify="flex-start"
                      component={Link} 
                      href={`/agents/${agent.id}/edit`}
                      leftSection={<Settings size={18} />}
                      radius="md"
                    >
                      Settings
                    </Button>
                  </Stack>
                </Paper>

                {/* Instructions */}
                <Paper withBorder radius="lg" p="xl">
                  <Group gap="md" mb="lg">
                    <ThemeIcon size="lg" variant="light" color="blue" radius="md">
                      <Brain size={22} />
                    </ThemeIcon>
                    <Title order={3} fw={600}>Instructions</Title>
                  </Group>
                  <Paper bg="var(--mantine-color-default-hover)" p="lg" radius="md" withBorder>
                    <Text 
                      ff="monospace" 
                      size="sm" 
                      style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                      c={agent.systemPrompt ? 'var(--mantine-color-text)' : 'dimmed'}
                    >
                      {agent.systemPrompt || 'No system prompt configured'}
                    </Text>
                  </Paper>
                </Paper>

                {/* Timestamps */}
                <Paper withBorder radius="lg" p="xl">
                  <Group gap="md" mb="lg">
                    <ThemeIcon size="lg" variant="light" color="violet" radius="md">
                      <Calendar size={22} />
                    </ThemeIcon>
                    <Title order={3} fw={600}>Timestamps</Title>
                  </Group>
                  <Stack gap="lg">
                    <Box>
                      <Text size="sm" fw={600} c="dimmed" mb="xs">Created</Text>
                      <Paper bg="var(--mantine-color-default-hover)" p="sm" radius="md" withBorder>
                        <Text size="sm" fw={500}>
                          {new Date(agent.createdAt).toLocaleString()}
                        </Text>
                      </Paper>
                    </Box>
                    <Box>
                      <Text size="sm" fw={600} c="dimmed" mb="xs">Last Updated</Text>
                      <Paper bg="var(--mantine-color-default-hover)" p="sm" radius="md" withBorder>
                        <Text size="sm" fw={500}>
                          {new Date(agent.updatedAt).toLocaleString()}
                        </Text>
                      </Paper>
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </DashboardLayout>
  )
}
