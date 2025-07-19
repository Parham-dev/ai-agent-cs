'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Anchor,
  Container,
  Alert,
  Stack,
  Group,
  ThemeIcon
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { AlertCircle, LogIn, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers';
import type { LoginRequest } from '@/lib/types/auth';

export default function LoginPage() {
  const { login, isAuthenticated, loading, error } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.replace('/'); // Use replace to avoid back button issues
    }
  }, [isAuthenticated, loading, router]);

  const form = useForm<LoginRequest>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  });

  const handleSubmit = async (values: LoginRequest) => {
    setIsSubmitting(true);
    
    try {
      const result = await login(values);
      
      if (result.success) {
        notifications.show({
          title: 'Welcome back!',
          message: 'You have been successfully logged in.',
          color: 'green',
        });
        router.replace('/');
      } else {
        notifications.show({
          title: 'Login failed',
          message: result.error || 'Please check your credentials and try again.',
          color: 'red',
        });
      }
    } catch {
      notifications.show({
        title: 'Login error',
        message: 'An unexpected error occurred. Please try again.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <Stack align="center" gap="md">
            <Text size="sm" c="dimmed">Loading...</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} my={40}>
      <Group justify="center" mb="xl">
        <ThemeIcon size="xl" variant="light" color="blue">
          <Building2 size={24} />
        </ThemeIcon>
        <Title order={2}>AI Customer Service</Title>
      </Group>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title order={3} ta="center" mb="md">
          Welcome back
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="xl">
          Sign in to your account to continue
        </Text>

        {error && (
          <Alert
            icon={<AlertCircle size={16} />}
            title="Authentication Error"
            color="red"
            mb="md"
          >
            {error}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="your@email.com"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              {...form.getInputProps('password')}
            />

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              leftSection={<LogIn size={16} />}
              size="md"
            >
              Sign In
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt="md">
          Don&apos;t have an account?{' '}
          <Anchor component={Link} href="/auth/signup" size="sm" fw={500}>
            Create account
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}