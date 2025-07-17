"use client"

import { Bell, Search, User, ChevronDown, Zap } from 'lucide-react'
import { Group, TextInput, ActionIcon, Badge, Avatar, Menu, Title, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { MantineThemeToggle } from '@/components/providers'
import Link from 'next/link'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title = "Dashboard", subtitle }: HeaderProps) {
  const [menuOpened, { toggle: toggleMenu }] = useDisclosure(false)

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
                <Text size="sm" visibleFrom="md">Demo User</Text>
                <ChevronDown size={16} />
              </Group>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item>Profile</Menu.Item>
              <Menu.Item>Settings</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red">Logout</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </div>
    </div>
  )
}