'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Paper, Stack, Text, Loader } from '@mantine/core';
import { useAuthContext } from '@/components/providers';
import type { UserRole } from '@/lib/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <Container size="xs" my={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Stack align="center" gap="md">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Loading...</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <Container size="xs" my={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Stack align="center" gap="md">
            <Text size="sm" c="dimmed">Redirecting to login...</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Check role permissions
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <Container size="xs" my={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Stack align="center" gap="md">
            <Text size="sm" c="red">
              Access denied. You don&apos;t have permission to view this page.
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return <>{children}</>;
}