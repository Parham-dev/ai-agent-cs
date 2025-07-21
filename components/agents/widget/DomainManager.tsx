'use client'

import { useState } from 'react'
import {
  Stack,
  Text,
  TextInput,
  Button,
  Group,
  Badge,
  ActionIcon
} from '@mantine/core'

interface DomainManagerProps {
  domains: string[]
  onDomainsChange: (domains: string[]) => void
}

export function DomainManager({ domains, onDomainsChange }: DomainManagerProps) {
  const [domainInput, setDomainInput] = useState('')

  const addDomain = () => {
    const domain = domainInput.trim()
    if (domain && !domains.includes(domain)) {
      const newDomains = domains.filter(d => d !== '*').concat(domain)
      onDomainsChange(newDomains)
      setDomainInput('')
    }
  }

  const removeDomain = (domain: string) => {
    const newDomains = domains.filter(d => d !== domain)
    if (newDomains.length === 0) {
      newDomains.push('*')
    }
    onDomainsChange(newDomains)
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addDomain()
    }
  }

  return (
    <Stack gap="sm">
      <Text fw={600}>Allowed Domains</Text>
      <Text size="sm" c="dimmed">
        Domains where this widget is allowed to be embedded
      </Text>
      
      <Group>
        <TextInput
          placeholder="example.com"
          flex={1}
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button onClick={addDomain} disabled={!domainInput.trim()}>
          Add
        </Button>
      </Group>

      <Group gap="xs">
        {domains.map((domain) => (
          <Badge
            key={domain}
            variant="light"
            rightSection={
              domain !== '*' ? (
                <ActionIcon 
                  size="xs" 
                  color="red" 
                  variant="transparent"
                  onClick={() => removeDomain(domain)}
                >
                  ×
                </ActionIcon>
              ) : undefined
            }
          >
            {domain}
          </Badge>
        ))}
      </Group>
    </Stack>
  )
}