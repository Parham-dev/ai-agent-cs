'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/layout'
import { 
  Card, 
  Grid, 
  Text, 
  Button, 
  Group, 
  Stack, 
  TextInput, 
  Badge, 
  ThemeIcon,
  ActionIcon,
  Center,
  Loader
} from '@mantine/core'
import { 
  Bot, 
  Plus, 
  Search, 
  Power,
  Edit,
  Trash2,
  MessageSquare,
  Eye,
  AlertCircle
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAgents } from '@/components/shared/hooks'
import type { ApiAgent } from '@/lib/types'

export default function AgentsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Use SWR for agents data with automatic caching and updates
  const { agents, isLoading, error, refreshAgents } = useAgents({ 
    search: searchTerm || undefined 
  })

  const handleToggleStatus = async (agent: ApiAgent) => {
    try {
      setActionLoading(agent.id)
      const updatedAgent = await api.agents.updateAgent(agent.id, { 
        isActive: !agent.isActive 
      })
      
      // Refresh SWR cache with updated data
      await refreshAgents()
      
      toast.success(`Agent ${updatedAgent.isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
      console.error('Failed to toggle agent status:', err)
      toast.error('Failed to update agent status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (agent: ApiAgent) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setActionLoading(agent.id)
      await api.agents.deleteAgent(agent.id)
      
      // Refresh SWR cache after deletion
      await refreshAgents()
      
      toast.success('Agent deleted successfully')
    } catch (err) {
      console.error('Failed to delete agent:', err)
      toast.error('Failed to delete agent')
    } finally {
      setActionLoading(null)
    }
  }

  // Filter is now handled by SWR hook with search parameter
  // No need for local filtering since SWR will handle server-side search

  if (isLoading) {
    return (
      <DashboardLayout title="Agents" subtitle="Manage your AI customer service agents">
        <Center h={300}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Loading agents...</Text>
          </Stack>
        </Center>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Agents" subtitle="Manage your AI customer service agents">
        <Card withBorder padding="xl" radius="md">
          <Stack align="center" gap="md">
            <ThemeIcon size="xl" variant="light" color="red">
              <AlertCircle size={24} />
            </ThemeIcon>
            <Stack align="center" gap="xs">
              <Text size="lg" fw={600}>Error Loading Agents</Text>
              <Text size="sm" c="dimmed" ta="center">{error instanceof Error ? error.message : error}</Text>
            </Stack>
            <Button onClick={() => refreshAgents()} leftSection={<Bot size={16} />}>
              Try Again
            </Button>
          </Stack>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Agents" subtitle="Manage your AI customer service agents">
      <Stack gap="xl">
        {/* Header Actions */}
        <Group justify="space-between" align="flex-start">
          <TextInput
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            leftSection={<Search size={16} />}
            w={{ base: '100%', sm: 300 }}
          />
          
          <Button 
            component={Link} 
            href="/agents/new" 
            leftSection={<Plus size={16} />}
          >
            Create Agent
          </Button>
        </Group>

        {/* Agents Stats */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder padding="lg" radius="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Total Agents</Text>
                  <Text size="xl" fw={700}>{agents.length}</Text>
                </Stack>
                <ThemeIcon size="xl" variant="light" color="blue">
                  <Bot size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder padding="lg" radius="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Active Agents</Text>
                  <Text size="xl" fw={700}>{agents.filter(a => a.isActive).length}</Text>
                </Stack>
                <ThemeIcon size="xl" variant="light" color="green">
                  <Power size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder padding="lg" radius="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Total Integrations</Text>
                  <Text size="xl" fw={700}>
                    {agents.reduce((sum, agent) => sum + (agent.agentIntegrations?.length || 0), 0)}
                  </Text>
                </Stack>
                <ThemeIcon size="xl" variant="light" color="grape">
                  <MessageSquare size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Agents List */}
        {agents.length === 0 ? (
          <Card withBorder padding="xl" radius="md">
            <Stack align="center" gap="md">
              <ThemeIcon size="xl" variant="light" color="gray">
                <Bot size={24} />
              </ThemeIcon>
              <Stack align="center" gap="xs">
                <Text size="lg" fw={600}>
                  {searchTerm ? 'No agents found' : 'No agents yet'}
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  {searchTerm 
                    ? `No agents match "${searchTerm}". Try adjusting your search.`
                    : 'Create your first AI agent to start handling customer inquiries.'
                  }
                </Text>
              </Stack>
              {!searchTerm && (
                <Button 
                  component={Link} 
                  href="/agents/new" 
                  size="lg"
                  leftSection={<Plus size={16} />}
                >
                  Create Your First Agent
                </Button>
              )}
            </Stack>
          </Card>
        ) : (
          <Grid>
            {agents.map((agent) => (
              <Grid.Col key={agent.id} span={{ base: 12, lg: 6 }}>
                <Card withBorder padding="lg" radius="md" style={{ height: '100%' }}>
                  <Stack gap="md" h="100%">
                    {/* Agent Header */}
                    <Group justify="space-between" align="flex-start">
                      <Group gap="md" align="flex-start" style={{ flex: 1 }}>
                        <ThemeIcon 
                          size="lg" 
                          variant="light" 
                          color={agent.isActive ? 'green' : 'gray'}
                        >
                          <Bot size={20} />
                        </ThemeIcon>
                        <Stack gap="xs" style={{ flex: 1 }}>
                          <Text 
                            component={Link} 
                            href={`/agents/${agent.id}`}
                            fw={600} 
                            style={{ textDecoration: 'none' }}
                            c="inherit"
                          >
                            {agent.name}
                          </Text>
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {agent.systemPrompt || agent.description || 'No description available'}
                          </Text>
                        </Stack>
                      </Group>
                      <Badge variant={agent.isActive ? 'filled' : 'light'} color={agent.isActive ? 'green' : 'gray'}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Group>

                    {/* Agent Details */}
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Model:</Text>
                        <Badge variant="outline" size="sm">{agent.model}</Badge>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Tools:</Text>
                        <Text size="sm">Via integrations</Text>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Integrations:</Text>
                        <Text size="sm">{agent.agentIntegrations?.length || 0} connected</Text>
                      </Group>
                    </Stack>

                    {/* Action Buttons */}
                    <Group justify="space-between" pt="md" style={{ borderTop: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))' }}>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => router.push(`/agents/${agent.id}`)}
                          title="View details"
                        >
                          <Eye size={16} />
                        </ActionIcon>
                        
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleToggleStatus(agent)}
                          loading={actionLoading === agent.id}
                          color={agent.isActive ? 'red' : 'green'}
                          title={agent.isActive ? 'Deactivate agent' : 'Activate agent'}
                        >
                          <Power size={16} />
                        </ActionIcon>
                        
                        <ActionIcon
                          variant="subtle"
                          onClick={() => router.push(`/agents/${agent.id}/edit`)}
                          title="Edit agent"
                        >
                          <Edit size={16} />
                        </ActionIcon>
                        
                        <ActionIcon
                          variant="subtle"
                          onClick={() => router.push(`/chat/${agent.id}`)}
                          title="Test chat"
                        >
                          <MessageSquare size={16} />
                        </ActionIcon>
                      </Group>
                      
                      <ActionIcon
                        variant="subtle"
                        onClick={() => handleDelete(agent)}
                        loading={actionLoading === agent.id}
                        color="red"
                        title="Delete agent"
                      >
                        <Trash2 size={16} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>
    </DashboardLayout>
  )
}