'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { 
  Card, 
  Grid, 
  Text, 
  Button, 
  Group, 
  Stack, 
  ThemeIcon,
  Badge,
  Center,
  Loader,
  Modal,
  NumberInput,
  Tabs,
  Table,
  Alert
} from '@mantine/core'
import { 
  CreditCard, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Download,
  Wallet,
  Activity,
  Calendar,
  DollarSign,
  Zap,
  RefreshCw,
  Info
} from 'lucide-react'
import { useDisclosure } from '@mantine/hooks'
import { toast } from 'sonner'
import { useBillingData } from '@/components/shared/hooks/use-billing-data'
import { api } from '@/lib/api'

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [addCreditsOpened, { open: openAddCredits, close: closeAddCredits }] = useDisclosure(false)
  const [creditsAmount, setCreditsAmount] = useState<number | string>(10)
  const [addingCredits, setAddingCredits] = useState(false)

  const { 
    billingData, 
    usageData, 
    transactions, 
    isLoading, 
    error, 
    refreshData 
  } = useBillingData()

  const handleAddCredits = async () => {
    try {
      setAddingCredits(true)
      await api.organization.addCredits(Number(creditsAmount))
      await refreshData()
      toast.success(`Successfully added $${creditsAmount} in credits`)
      closeAddCredits()
      setCreditsAmount(10)
    } catch (error) {
      toast.error('Failed to add credits')
      console.error('Add credits error:', error)
    } finally {
      setAddingCredits(false)
    }
  }

  const handleExportUsage = () => {
    // TODO: Implement CSV export functionality
    toast.info('Export feature coming soon')
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Usage & Billing" subtitle="Monitor your usage and manage credits">
          <Center h={400}>
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed">Loading billing data...</Text>
            </Stack>
          </Center>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Usage & Billing" subtitle="Monitor your usage and manage credits">
          <Alert variant="light" color="red" title="Error Loading Billing Data" icon={<AlertTriangle size={16} />}>
            {error}
            <Button variant="subtle" size="sm" mt="sm" onClick={refreshData} leftSection={<RefreshCw size={14} />}>
              Try Again
            </Button>
          </Alert>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const creditStatus = billingData?.credits
  const isLowCredits = creditStatus && creditStatus.available > 0 && creditStatus.available < 1.0
  const isOutOfCredits = creditStatus && creditStatus.available <= 0

  return (
    <ProtectedRoute>
      <DashboardLayout title="Usage & Billing" subtitle="Monitor your usage and manage credits">
        <Stack gap="xl">
          {/* Credit Status Alert */}
          {isOutOfCredits && (
            <Alert variant="light" color="red" title="Credits Depleted" icon={<AlertTriangle size={16} />}>
              Your account has run out of credits. Add credits to continue using the service.
              <Button size="sm" mt="sm" onClick={openAddCredits} leftSection={<Plus size={14} />}>
                Add Credits
              </Button>
            </Alert>
          )}
          
          {isLowCredits && (
            <Alert variant="light" color="yellow" title="Low Credit Balance" icon={<Info size={16} />}>
              Your credit balance is running low. Consider adding more credits to avoid service interruption.
            </Alert>
          )}

          {/* Key Metrics */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder padding="lg" radius="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">Current Balance</Text>
                    <Text size="2rem" fw={700} c={isOutOfCredits ? 'red' : isLowCredits ? 'yellow' : 'inherit'}>
                      ${creditStatus?.available?.toFixed(2) ?? '0.00'}
                    </Text>
                  </Stack>
                  <ThemeIcon size="xl" variant="light" color={isOutOfCredits ? 'red' : isLowCredits ? 'yellow' : 'green'}>
                    <Wallet size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder padding="lg" radius="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">This Month</Text>
                    <Text size="2rem" fw={700}>
                      ${billingData?.currentMonth?.totalUserCost?.toFixed(2) ?? '0.00'}
                    </Text>
                  </Stack>
                  <ThemeIcon size="xl" variant="light" color="blue">
                    <Activity size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder padding="lg" radius="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">Conversations</Text>
                    <Text size="2rem" fw={700}>
                      {billingData?.currentMonth?.conversations?.toLocaleString() ?? '0'}
                    </Text>
                  </Stack>
                  <ThemeIcon size="xl" variant="light" color="grape">
                    <Zap size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder padding="lg" radius="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">Avg Cost/Conversation</Text>
                    <Text size="2rem" fw={700}>
                      ${billingData?.currentMonth?.conversations && billingData.currentMonth.conversations > 0 
                        ? (billingData.currentMonth.totalUserCost / billingData.currentMonth.conversations).toFixed(4)
                        : '0.0000'}
                    </Text>
                  </Stack>
                  <ThemeIcon size="xl" variant="light" color="teal">
                    <TrendingUp size={24} />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Tabs Section */}
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'overview')}>
            <Tabs.List>
              <Tabs.Tab value="overview" leftSection={<CreditCard size={16} />}>
                Overview
              </Tabs.Tab>
              <Tabs.Tab value="usage" leftSection={<Activity size={16} />}>
                Usage Details
              </Tabs.Tab>
              <Tabs.Tab value="transactions" leftSection={<DollarSign size={16} />}>
                Transactions
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="overview" pt="xl">
              <Grid>
                {/* Credit Balance Card */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder padding="lg" radius="md" h="100%">
                    <Stack gap="md" h="100%">
                      <Group justify="space-between" align="flex-start">
                        <Text size="lg" fw={600}>Credit Balance</Text>
                        <Button 
                          size="sm" 
                          leftSection={<Plus size={16} />}
                          onClick={openAddCredits}
                        >
                          Add Credits
                        </Button>
                      </Group>
                      
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Free Credits</Text>
                          <Text size="sm" fw={500}>
                            ${creditStatus?.freeCredits?.toFixed(2) ?? '0.00'}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Paid Credits</Text>
                          <Text size="sm" fw={500}>
                            ${creditStatus?.paidCredits?.toFixed(2) ?? '0.00'}
                          </Text>
                        </Group>
                        <Group justify="space-between" pt="xs" style={{ borderTop: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))' }}>
                          <Text size="sm" fw={600}>Total Balance</Text>
                          <Text size="sm" fw={600}>
                            ${creditStatus?.available?.toFixed(2) ?? '0.00'}
                          </Text>
                        </Group>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid.Col>

                {/* Top Models Card */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Card withBorder padding="lg" radius="md" h="100%">
                    <Stack gap="md" h="100%">
                      <Text size="lg" fw={600}>Top Models by Usage</Text>
                      
                      {billingData?.topModels && billingData.topModels.length > 0 ? (
                        <Stack gap="sm">
                          {billingData.topModels.slice(0, 5).map((model, index) => (
                            <Group key={model.model} justify="space-between">
                              <Group gap="xs">
                                <Badge size="sm" variant="outline">{index + 1}</Badge>
                                <Text size="sm">{model.model}</Text>
                              </Group>
                              <Group gap="sm">
                                <Text size="xs" c="dimmed">{model.count} requests</Text>
                                <Text size="sm" fw={500}>${model.userCost?.toFixed(8) || model.cost.toFixed(8)}</Text>
                              </Group>
                            </Group>
                          ))}
                        </Stack>
                      ) : (
                        <Center style={{ flex: 1 }}>
                          <Text size="sm" c="dimmed">No usage data available</Text>
                        </Center>
                      )}
                    </Stack>
                  </Card>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            <Tabs.Panel value="usage" pt="xl">
              <Stack gap="lg">
                <Group justify="space-between">
                  <Text size="lg" fw={600}>Usage Details</Text>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    leftSection={<Download size={16} />}
                    onClick={handleExportUsage}
                  >
                    Export Usage
                  </Button>
                </Group>

                {usageData && usageData.length > 0 ? (
                  <Card withBorder padding="lg" radius="md">
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Date</Table.Th>
                          <Table.Th>Agent</Table.Th>
                          <Table.Th>Model</Table.Th>
                          <Table.Th>Tokens</Table.Th>
                          <Table.Th>Cost</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {usageData.slice(0, 20).map((usage, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>
                              <Text size="sm">
                                {new Date(usage.createdAt).toLocaleDateString()}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{usage.source || 'Unknown'}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge size="sm" variant="outline">{usage.model}</Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{usage.totalTokens?.toLocaleString()}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" fw={500}>${usage.userCost?.toFixed(12)}</Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Card>
                ) : (
                  <Card withBorder padding="xl" radius="md">
                    <Center>
                      <Stack align="center" gap="md">
                        <ThemeIcon size="xl" variant="light" color="gray">
                          <Activity size={24} />
                        </ThemeIcon>
                        <Text size="lg" fw={600}>No Usage Data</Text>
                        <Text size="sm" c="dimmed" ta="center">
                          Usage details will appear here once you start using the service.
                        </Text>
                      </Stack>
                    </Center>
                  </Card>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="transactions" pt="xl">
              <Stack gap="lg">
                <Text size="lg" fw={600}>Transaction History</Text>

                {transactions && transactions.length > 0 ? (
                  <Card withBorder padding="lg" radius="md">
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Date</Table.Th>
                          <Table.Th>Type</Table.Th>
                          <Table.Th>Amount</Table.Th>
                          <Table.Th>Description</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {transactions.map((transaction) => (
                          <Table.Tr key={transaction.id}>
                            <Table.Td>
                              <Text size="sm">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge 
                                size="sm" 
                                variant="light"
                                color={
                                  transaction.type === 'CREDIT_PURCHASE' ? 'green' :
                                  transaction.type === 'FREE_CREDIT' ? 'blue' :
                                  transaction.type === 'USAGE_DEDUCTION' ? 'orange' :
                                  'red'
                                }
                              >
                                {transaction.type.replace('_', ' ')}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text 
                                size="sm" 
                                fw={500}
                                c={transaction.amount > 0 ? 'green' : 'red'}
                              >
                                {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(12)}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed">
                                {transaction.description || 'No description'}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Card>
                ) : (
                  <Card withBorder padding="xl" radius="md">
                    <Center>
                      <Stack align="center" gap="md">
                        <ThemeIcon size="xl" variant="light" color="gray">
                          <Calendar size={24} />
                        </ThemeIcon>
                        <Text size="lg" fw={600}>No Transactions</Text>
                        <Text size="sm" c="dimmed" ta="center">
                          Your transaction history will appear here.
                        </Text>
                      </Stack>
                    </Center>
                  </Card>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>

        {/* Add Credits Modal */}
        <Modal
          opened={addCreditsOpened}
          onClose={closeAddCredits}
          title="Add Credits"
          size="sm"
        >
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Add credits to your account to continue using the service. Credits are charged based on actual usage with a 15% margin.
            </Text>
            
            <NumberInput
              label="Credit Amount ($)"
              placeholder="Enter amount"
              value={creditsAmount}
              onChange={setCreditsAmount}
              min={1}
              max={1000}
              step={1}
              leftSection="$"
            />
            
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeAddCredits}>
                Cancel
              </Button>
              <Button
                loading={addingCredits}
                onClick={handleAddCredits}
                leftSection={<Plus size={16} />}
              >
                Add Credits
              </Button>
            </Group>
          </Stack>
        </Modal>
      </DashboardLayout>
    </ProtectedRoute>
  )
}