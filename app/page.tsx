'use client';

import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, Grid, Text, Button, Group, Stack, ThemeIcon, Anchor, Badge } from '@mantine/core'
import Link from 'next/link'
import { Bot, Plug, Building2, Plus } from 'lucide-react'

export default function HomePage() {
  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Manage your AI agents and integrations"
    >
      <Stack gap="xl">
        {/* Quick Stats */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder padding="lg" radius="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Total Agents</Text>
                  <Text size="2rem" fw={700}>0</Text>
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
                  <Text size="sm" c="dimmed">Active Integrations</Text>
                  <Text size="2rem" fw={700}>0</Text>
                </Stack>
                <ThemeIcon size="xl" variant="light" color="green">
                  <Plug size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder padding="lg" radius="md">
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Organizations</Text>
                  <Text size="2rem" fw={700}>0</Text>
                </Stack>
                <ThemeIcon size="xl" variant="light" color="grape">
                  <Building2 size={24} />
                </ThemeIcon>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Quick Actions */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder padding="lg" radius="md" h="100%">
              <Stack gap="md" h="100%">
                <Group justify="space-between" align="flex-start">
                  <Text size="lg" fw={600}>Agents</Text>
                  <Anchor component={Link} href="/agents" size="sm" fw={500}>
                    View all
                  </Anchor>
                </Group>
                <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                  Create and manage your AI customer service agents
                </Text>
                <Button 
                  component={Link} 
                  href="/agents/new"
                  leftSection={<Plus size={16} />}
                  variant="filled"
                  color="blue"
                  size="sm"
                  style={{ alignSelf: 'flex-start' }}
                >
                  Create Agent
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder padding="lg" radius="md" h="100%">
              <Stack gap="md" h="100%">
                <Group justify="space-between" align="flex-start">
                  <Text size="lg" fw={600}>Integrations</Text>
                  <Badge variant="light" color="gray" size="sm">Coming soon</Badge>
                </Group>
                <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                  Connect to your business platforms and tools
                </Text>
                <Button 
                  leftSection={<Plus size={16} />}
                  variant="filled"
                  color="gray"
                  size="sm"
                  disabled
                  style={{ alignSelf: 'flex-start' }}
                >
                  Add Integration
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </DashboardLayout>
  );
}
