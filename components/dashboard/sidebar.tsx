"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Menu, 
  X,
  Bot,
  Puzzle
} from 'lucide-react'
import { NavLink, Group, Text, ActionIcon, Indicator } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ size?: number }>
  badge?: string
}

const navigation: NavItem[] = [
  { name: 'Overview', href: '/', icon: Home },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Integrations', href: '/integrations', icon: Puzzle },
]

export function Sidebar() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false)
  const pathname = usePathname()

  const SidebarContent = () => (
    <div 
      style={{ 
        height: '100%',
        backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))',
        borderRight: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Navigation */}
      <div style={{ flex: 1, padding: '16px', paddingTop: '24px' }}>
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <NavLink
              key={item.name}
              component={Link}
              href={item.href}
              label={item.name}
              leftSection={<item.icon size={18} />}
              rightSection={
                item.badge ? (
                  <Text size="xs" c="blue" fw={500}>
                    {item.badge}
                  </Text>
                ) : undefined
              }
              active={isActive}
              variant="filled"
              onClick={closeMobile}
            />
          )
        })}
      </div>

      {/* Bottom section */}
      <Group justify="center" p="md" style={{ borderTop: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))' }}>
        <div style={{ textAlign: 'center' }}>
          <Text size="xs" c="dimmed">
            Demo Store
          </Text>
          <Group justify="center" gap="xs" mt={4}>
            <Indicator color="green" size={6} />
            <Text size="xs" c="green">
              Online
            </Text>
          </Group>
        </div>
      </Group>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <ActionIcon
        onClick={toggleMobile}
        hiddenFrom="lg"
        size="lg"
        variant="subtle"
      >
        <Menu size={18} />
      </ActionIcon>

      {/* Mobile sidebar overlay */}
      {mobileOpened && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 2000
          }}
          onClick={closeMobile}
        >
          <div 
            style={{
              width: '280px',
              height: '100%',
              backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))',
              borderRight: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Group justify="space-between" px="lg" py="md" style={{ borderBottom: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))' }}>
              <Text size="lg" fw={600}>Menu</Text>
              <ActionIcon variant="subtle" onClick={closeMobile}>
                <X size={18} />
              </ActionIcon>
            </Group>
            <div style={{ padding: '16px', flex: 1 }}>
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <NavLink
                    key={item.name}
                    component={Link}
                    href={item.href}
                    label={item.name}
                    leftSection={<item.icon size={18} />}
                    rightSection={
                      item.badge ? (
                        <Text size="xs" c="blue" fw={500}>
                          {item.badge}
                        </Text>
                      ) : undefined
                    }
                    active={isActive}
                    variant="filled"
                    onClick={closeMobile}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar content */}
      <SidebarContent />
    </>
  )
}