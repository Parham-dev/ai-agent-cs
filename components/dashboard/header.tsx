"use client"

import { useState } from 'react'
import { Bell, Search, User, ChevronDown, Zap, LogOut, Settings, UserIcon } from 'lucide-react'
import { Group, TextInput, ActionIcon, Badge, Avatar, Menu, Title, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { MantineThemeToggle, useAuthContext } from '@/components/providers'
import Link from 'next/link'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title = "Dashboard", subtitle }: HeaderProps) {
  const [menuOpened, { toggle: toggleMenu }] = useDisclosure(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, logout } = useAuthContext()

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    
    try {
      await logout()
      
      // Show success notification
      notifications.show({
        title: 'Logged out',
        message: 'You have been successfully logged out.',
        color: 'green',
      })

      // Note: redirect is handled in the logout function
    } catch {
      // Show error notification
      notifications.show({
        title: 'Logout Error',
        message: 'There was an issue logging out, but you will be redirected.',
        color: 'orange',
      })
    } finally {
      // Keep loading state until redirect happens
      // Don't set to false as component will unmount
    }
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: 80, position: 'relative' }}>
      {/* Logo Section - Fixed width to match sidebar - Hidden on mobile */}
      <div
        style={{
          width: 280,
          alignItems: 'center',
          paddingLeft: 'var(--mantine-spacing-lg)',
          paddingRight: 'var(--mantine-spacing-lg)',
          borderBottom: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
          borderRight: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
          backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))'
        }}
        className="hidden lg:flex"
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Group gap="sm">
            <Avatar 
              size="sm" 
              radius="md"
              variant="gradient"
              gradient={{ from: 'blue', to: 'purple' }}
            >
              <Zap size={16} />
            </Avatar>
            <Text size="xl" fw={700}>
              AI CS
            </Text>
          </Group>
        </Link>
      </div>

      {/* Main Header Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: 'var(--mantine-spacing-lg)',
          paddingRight: 'var(--mantine-spacing-lg)',
          borderBottom: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
          backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))'
        }}
      >
        {/* Title Section */}
        <div>
          <Title order={2} size="h1">
            {title}
          </Title>
          {subtitle && (
            <Text size="sm" c="dimmed" mt={4}>
              {subtitle}
            </Text>
          )}
        </div>

        {/* Right side - Search, Notifications, Theme, Profile */}
        <Group gap="sm">
          {/* Search */}
          <TextInput
            placeholder="Search conversations..."
            leftSection={<Search size={16} />}
            w={250}
            visibleFrom="md"
          />

          {/* Notifications */}
          <ActionIcon 
            variant="subtle" 
            size="lg" 
            pos="relative"
            style={{ overflow: 'visible' }}
          >
            <Bell size={18} />
            <Badge 
              size="xs" 
              variant="filled" 
              color="red" 
              pos="absolute" 
              top={-8} 
              right={-8}
              style={{ 
                minWidth: 18, 
                height: 18, 
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 600,
                zIndex: 10
              }}
            >
              3
            </Badge>
          </ActionIcon>

          {/* Theme Toggle */}
          <MantineThemeToggle />

          {/* Profile Menu */}
          <Menu opened={menuOpened} onClose={toggleMenu} position="bottom-end" zIndex={200}>
            <Menu.Target>
              <Group gap="xs" style={{ cursor: 'pointer' }} onClick={toggleMenu}>
                <Avatar 
                  size="sm" 
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'purple' }}
                >
                  <User size={16} />
                </Avatar>
                <Text size="sm" visibleFrom="md">
                  {user?.name || user?.email || 'User'}
                </Text>
                <ChevronDown size={16} />
              </Group>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<UserIcon size={16} />}>
                Profile
              </Menu.Item>
              <Menu.Item leftSection={<Settings size={16} />}>
                Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item 
                color="red" 
                leftSection={isLoggingOut ? undefined : <LogOut size={16} />}
                onClick={handleLogout}
                disabled={isLoggingOut}
                style={{ 
                  opacity: isLoggingOut ? 0.6 : 1,
                  cursor: isLoggingOut ? 'wait' : 'pointer'
                }}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </div>
    </div>
  )
}