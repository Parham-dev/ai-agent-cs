"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Menu, 
  X,
  Bot,
  Puzzle,
  CreditCard
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
  { name: 'Usage & Billing', href: '/billing', icon: CreditCard },
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
          // Enhanced active state logic
          let isActive = pathname === item.href
          
          // Handle null pathname
          if (!pathname) {
            isActive = false
          } else {
            // Special cases for nested routes
            if (item.href === '/agents') {
              // Highlight Agents for:
              // - /agents (exact match)
              // - /agents/* (any agents sub-page)
              // - /chat/* (chat is agent-related)
              isActive = pathname === '/agents' || 
                        pathname.startsWith('/agents/') || 
                        pathname.startsWith('/chat/')
            } else if (item.href === '/') {
              // Only highlight Overview for exact match to avoid conflicts
              isActive = pathname === '/'
            } else {
              // For other items, check if pathname starts with the href
              isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            }
          }
          
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

      {/* Bottom section - aligned with chat area composer */}
      <div style={{ 
        height: '80px',
        padding: '16px', 
        borderTop: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
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
      </div>
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
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
                {navigation.map((item) => {
                  // Enhanced active state logic for mobile
                  let isActive = pathname === item.href
                  
                  // Handle null pathname
                  if (!pathname) {
                    isActive = false
                  } else {
                    // Special cases for nested routes
                    if (item.href === '/agents') {
                      // Highlight Agents for:
                      // - /agents (exact match)
                      // - /agents/* (any agents sub-page)
                      // - /chat/* (chat is agent-related)
                      isActive = pathname === '/agents' || 
                                pathname.startsWith('/agents/') || 
                                pathname.startsWith('/chat/')
                    } else if (item.href === '/') {
                      // Only highlight Overview for exact match to avoid conflicts
                      isActive = pathname === '/'
                    } else {
                      // For other items, check if pathname starts with the href
                      isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    }
                  }
                  
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
              
              {/* Mobile footer - aligned with chat area composer */}
              <div style={{ 
                height: '80px',
                borderTop: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '16px'
              }}>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar content */}
      <SidebarContent />
    </>
  )
}