'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { 
  Card, 
  Stack, 
  TextInput, 
  Button, 
  Group, 
  Text, 
  Alert,
  LoadingOverlay,
  Title,
  Badge,
  Skeleton
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { User, Mail, Shield, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/components/shared/hooks'

interface ProfileFormData {
  name: string
  email: string
}

export default function ProfilePage() {
  const { user, isLoading: userLoading, updateProfile } = useUser()
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const form = useForm<ProfileFormData>({
    mode: 'controlled',
    initialValues: {
      name: '',
      email: ''
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        if (value.trim().length > 50) return 'Name must be less than 50 characters'
        return null
      },
      email: (value) => {
        if (!value.trim()) return 'Email is required'
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format'
        return null
      }
    }
  })

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.setValues({
        name: user.name || '',
        email: user.email || ''
      })
    }
    // ESLint disable: form object changes on every render, we only want to run when user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const handleSave = async (values: ProfileFormData) => {
    if (!user) return

    setLoading(true)
    setSaveStatus('idle')

    try {
      // Check if email changed (not supported)
      if (values.email !== user.email) {
        toast.error('Email changes are not yet supported. Please contact support.')
        setLoading(false)
        return
      }

      // Use SWR's optimistic update
      await updateProfile({ name: values.name.trim() })

      setSaveStatus('success')
      toast.success('Profile updated successfully')
      
    } catch (error) {
      console.error('Profile update error:', error)
      setSaveStatus('error')
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while user data is being fetched
  if (userLoading) {
    return (
      <DashboardLayout title="Profile" subtitle="Manage your account information">
        <Stack gap="lg">
          <Card withBorder p="xl">
            <Stack gap="lg">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Skeleton height={28} width={200} mb={4} />
                  <Skeleton height={16} width={300} />
                </div>
                <Skeleton height={24} width={80} />
              </Group>
              
              <Stack gap="md">
                <Skeleton height={60} />
                <Skeleton height={60} />
                <Group justify="flex-end">
                  <Skeleton height={36} width={120} />
                </Group>
              </Stack>
            </Stack>
          </Card>
          
          <Card withBorder p="xl">
            <Skeleton height={28} width={200} mb="md" />
            <Stack gap="md">
              {Array.from({ length: 4 }).map((_, i) => (
                <Group key={i} justify="space-between">
                  <Skeleton height={16} width={100} />
                  <Skeleton height={16} width={150} />
                </Group>
              ))}
            </Stack>
          </Card>
        </Stack>
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout title="Profile">
        <Alert color="orange" icon={<AlertCircle size={16} />}>
          Unable to load user information. Please try refreshing the page.
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Profile" subtitle="Manage your account information">
      <Stack gap="lg">
        {/* Profile Information Card */}
        <Card withBorder p="xl" style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />
          
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={3} size="h4" mb={4}>
                  Profile Information
                </Title>
                <Text size="sm" c="dimmed">
                  Update your personal information and account details
                </Text>
              </div>
              <Badge 
                color={user.isActive ? 'green' : 'red'} 
                variant="light"
                leftSection={<Shield size={12} />}
              >
                {user.role}
              </Badge>
            </Group>

            {saveStatus === 'success' && (
              <Alert color="green" icon={<CheckCircle size={16} />}>
                Profile updated successfully
              </Alert>
            )}

            {saveStatus === 'error' && (
              <Alert color="red" icon={<AlertCircle size={16} />}>
                Failed to update profile. Please try again.
              </Alert>
            )}

            <form onSubmit={form.onSubmit(handleSave)}>
              <Stack gap="md">
                <TextInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  leftSection={<User size={16} />}
                  required
                  {...form.getInputProps('name')}
                />

                <TextInput
                  label="Email Address"
                  placeholder="your.email@example.com"
                  leftSection={<Mail size={16} />}
                  readOnly
                  style={{ 
                    cursor: 'not-allowed',
                    opacity: 0.7
                  }}
                  description="Email changes are not currently supported. Contact support for assistance."
                  {...form.getInputProps('email')}
                />

                <Group justify="flex-end" mt="md">
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={!form.isDirty() || !form.isValid()}
                  >
                    Save Changes
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Card>

        {/* Account Information Card */}
        <Card withBorder p="xl">
          <Stack gap="md">
            <Title order={3} size="h4">
              Account Information
            </Title>
            
            <Group justify="space-between">
              <Text size="sm" fw={500}>User ID</Text>
              <Text size="sm" c="dimmed" ff="monospace">{user.id}</Text>
            </Group>
            
            <Group justify="space-between">
              <Text size="sm" fw={500}>Account Status</Text>
              <Badge color={user.isActive ? 'green' : 'red'} variant="light">
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </Group>
            
            <Group justify="space-between">
              <Text size="sm" fw={500}>Role</Text>
              <Badge color="blue" variant="light">
                {user.role}
              </Badge>
            </Group>
            
            <Group justify="space-between">
              <Text size="sm" fw={500}>Member Since</Text>
              <Text size="sm" c="dimmed">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </Group>
            
            {user.organizationId && (
              <Group justify="space-between">
                <Text size="sm" fw={500}>Organization</Text>
                <Text size="sm" c="dimmed" ff="monospace">{user.organizationId}</Text>
              </Group>
            )}
          </Stack>
        </Card>
      </Stack>
    </DashboardLayout>
  )
}
