"use client"

import Link from 'next/link'
import { Heart, Github, Twitter } from 'lucide-react'
import { Group, Text, ActionIcon, Anchor } from '@mantine/core'

export function Footer() {
  return (
    <Group 
      justify="space-between" 
      px="lg" 
      py="sm"
      h={40}
      wrap="wrap" 
      style={{ 
        borderTop: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
        backgroundColor: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))'
      }}
    >
      {/* Left side - Copyright */}
      <Group gap="xs" wrap="wrap">
        <Text size="sm" c="dimmed">
          © 2024 AI Customer Service Platform
        </Text>
        <Text size="sm" c="dimmed">•</Text>
        <Group gap={4} align="center">
          <Text size="sm" c="dimmed">Made with</Text>
          <Heart size={12} color="red" fill="red" />
          <Text size="sm" c="dimmed">by the community</Text>
        </Group>
      </Group>

      {/* Right side - Links */}
      <Group gap="lg">
        <Group gap="md">
          <Anchor 
            component={Link} 
            href="/docs" 
            size="sm" 
            c="dimmed"
          >
            Docs
          </Anchor>
          <Anchor 
            component={Link} 
            href="/support" 
            size="sm" 
            c="dimmed"
          >
            Support
          </Anchor>
          <Anchor 
            component={Link} 
            href="/changelog" 
            size="sm" 
            c="dimmed"
          >
            Changelog
          </Anchor>
        </Group>
        
        <Group gap="xs">
          <ActionIcon 
            component={Link}
            href="https://github.com/yourusername/ai-customer-service-platform"
            variant="subtle"
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={16} />
          </ActionIcon>
          <ActionIcon 
            component={Link}
            href="https://twitter.com/aicustomerplatform"
            variant="subtle"
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Twitter size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Group>
  )
}