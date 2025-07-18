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
import { AlertCircle, UserPlus, Building2, Check } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/components/providers';
import type { SignupRequest } from '@/lib/types';

export default function SignupPage() {
  const { signup, isAuthenticated, loading } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.replace('/'); // Use replace to avoid back button issues
    }
  }, [isAuthenticated, loading, router]);

  const form = useForm<SignupRequest>({
    initialValues: {
      name: '',
      email: '',
      password: '',
    },
    validate: {
      name: (value) => (value && value.length < 2 ? 'Name must be at least 2 characters' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => {
        if (value.length < 6) return 'Password must be at least 6 characters';
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
        return null;
      },
    },
  });

  const handleSubmit = async (values: SignupRequest) => {
    setIsSubmitting(true);
    
    try {
      const result = await signup(values);
      
      if (result.success) {
        notifications.show({
          title: 'Account created!',
          message: result.message || 'Your account has been created successfully.',
          color: 'green',
          icon: <Check size={16} />,
        });
        
        // If email confirmation is required, show info and redirect to login
        if (result.message?.includes('email')) {
          setTimeout(() => {
            router.replace('/auth/login');
          }, 2000);
        } else {
          // Auto-login successful, redirect to dashboard after a short delay
          setTimeout(() => {
            router.replace('/');
          }, 1500);
        }
      } else {
        notifications.show({
          title: 'Signup failed',
          message: result.error || 'Failed to create account. Please try again.',
          color: 'red',
        });
        setIsSubmitting(false);
      }
    } catch {
      notifications.show({
        title: 'Signup error',
        message: 'An unexpected error occurred. Please try again.',
        color: 'red',
      });
      setIsSubmitting(false);
    }
    // Note: Don't set isSubmitting to false if success, keep loading until redirect
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
          Create your account
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="xl">
          Get started with your AI customer service platform
        </Text>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              required
              {...form.getInputProps('name')}
            />

            <TextInput
              label="Email"
              placeholder="your@email.com"
              required
              {...form.getInputProps('email')}
            />

            <PasswordInput
              label="Password"
              placeholder="Create a strong password"
              required
              {...form.getInputProps('password')}
            />

            {form.errors.password && (
              <Alert
                icon={<AlertCircle size={16} />}
                title="Password Requirements"
                color="orange"
                variant="light"
              >
                <Text size="xs">
                  Password must contain:
                  <br />• At least 6 characters
                  <br />• One uppercase letter
                  <br />• One lowercase letter  
                  <br />• One number
                </Text>
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              leftSection={!isSubmitting ? <UserPlus size={16} /> : undefined}
              size="md"
            >
              {isSubmitting ? 'Creating your account...' : 'Create Account'}
            </Button>
          </Stack>
        </form>

        <Text c="dimmed" size="sm" ta="center" mt="md">
          Already have an account?{' '}
          <Anchor component={Link} href="/auth/login" size="sm" fw={500}>
            Sign in
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}