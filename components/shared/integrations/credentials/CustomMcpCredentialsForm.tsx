'use client'

import { Text, Code, Stack } from '@mantine/core'
import { BaseCredentialsForm } from './BaseCredentialsForm'
import type { ApiIntegration } from '@/lib/types'
import type { CustomMcpCredentials } from '@/lib/types/integrations'

interface CustomMcpCredentialsFormProps {
  integration?: ApiIntegration | null
  onSaved?: (integration: ApiIntegration) => Promise<void> | void
  tempIntegrationId?: string
}

const customMcpConfig = {
  type: 'custom-mcp' as const,
  displayName: 'Custom MCP Server',
  fields: [
    {
      key: 'name',
      label: 'Server Name',
      type: 'text' as const,
      placeholder: 'My Custom MCP Server',
      validate: (value: string) => value.trim() ? null : 'Server name is required'
    },
    {
      key: 'serverType',
      label: 'Server Type',
      type: 'select' as const,
      placeholder: 'Select server type',
      description: 'Choose the type of MCP server you want to connect to',
      options: [
        { value: 'hosted', label: 'Hosted MCP Server Tools (Recommended)' },
        { value: 'streamable-http', label: 'HTTP MCP Server' },
        { value: 'stdio', label: 'Command-Line MCP Server' }
      ],
      validate: (value: string) => value ? null : 'Server type is required'
    },

    // Hosted MCP Server fields
    {
      key: 'serverUrl',
      label: 'Server URL',
      type: 'text' as const,
      placeholder: 'https://example.com/mcp',
      description: 'The URL of the hosted MCP server endpoint',
      dependsOn: { field: 'serverType', value: 'hosted' },
      validate: (value: string) => {
        if (!value.trim()) return 'Server URL is required for hosted servers'
        try {
          new URL(value)
          return null
        } catch {
          return 'Please enter a valid URL'
        }
      }
    },
    {
      key: 'serverLabel',
      label: 'Server Label',
      type: 'text' as const,
      placeholder: 'my-mcp-server',
      description: 'A unique label to identify this server',
      dependsOn: { field: 'serverType', value: 'hosted' },
      validate: (value: string) => value.trim() ? null : 'Server label is required for hosted servers'
    },

    // HTTP MCP Server fields  
    {
      key: 'httpUrl',
      label: 'HTTP Server URL',
      type: 'text' as const,
      placeholder: 'http://localhost:8080',
      description: 'The URL of the HTTP MCP server',
      dependsOn: { field: 'serverType', value: 'streamable-http' },
      validate: (value: string) => {
        if (!value.trim()) return 'HTTP URL is required for HTTP servers'
        try {
          new URL(value)
          return null
        } catch {
          return 'Please enter a valid URL'
        }
      }
    },
    {
      key: 'authType',
      label: 'Authentication Type',
      type: 'select' as const,
      placeholder: 'Select authentication method',
      dependsOn: { field: 'serverType', value: 'streamable-http' },
      options: [
        { value: 'none', label: 'None' },
        { value: 'bearer', label: 'Bearer Token' },
        { value: 'api-key', label: 'API Key' },
        { value: 'basic', label: 'Basic Authentication' }
      ]
    },
    {
      key: 'authToken',
      label: 'Token / API Key',
      type: 'password' as const,
      placeholder: 'Enter your token or API key',
      dependsOn: { field: 'authType', value: 'bearer' }
    },
    {
      key: 'authToken',
      label: 'API Key',
      type: 'password' as const,
      placeholder: 'Enter your API key',
      dependsOn: { field: 'authType', value: 'api-key' }
    },
    {
      key: 'username',
      label: 'Username',
      type: 'text' as const,
      placeholder: 'Enter username',
      dependsOn: { field: 'authType', value: 'basic' }
    },
    {
      key: 'password',
      label: 'Password',
      type: 'password' as const,
      placeholder: 'Enter password',
      dependsOn: { field: 'authType', value: 'basic' }
    },

    // Stdio MCP Server fields
    {
      key: 'command',
      label: 'Command',
      type: 'text' as const,
      placeholder: 'npx @modelcontextprotocol/server-filesystem /path/to/directory',
      description: 'The full command to execute the MCP server',
      dependsOn: { field: 'serverType', value: 'stdio' },
      validate: (value: string) => value.trim() ? null : 'Command is required for stdio servers'
    },
    {
      key: 'workingDirectory',
      label: 'Working Directory (Optional)',
      type: 'text' as const,
      placeholder: '/path/to/working/directory',
      description: 'Directory to run the command from',
      dependsOn: { field: 'serverType', value: 'stdio' }
    }
  ],
  helpText: (
    <Stack gap="xs">
      <Text>
        Connect to any Model Context Protocol (MCP) server to extend your agent&apos;s capabilities.
      </Text>
      <Text size="sm" c="dimmed">
        <strong>Hosted:</strong> Use remote MCP servers (fastest, handled by OpenAI)
      </Text>
      <Text size="sm" c="dimmed">
        <strong>HTTP:</strong> Connect to local or remote HTTP MCP servers
      </Text>
      <Text size="sm" c="dimmed">
        <strong>Stdio:</strong> Run local MCP server processes via command line
      </Text>
      <Text size="xs" c="dimmed">
        Examples: <Code>npx @modelcontextprotocol/server-filesystem /data</Code>, <Code>python mcp_server.py</Code>
      </Text>
    </Stack>
  ),
  testConnection: async (credentials: Record<string, string>): Promise<boolean> => {
    try {
      const response = await fetch('/api/v2/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'custom-mcp',
          credentials: credentials as unknown as CustomMcpCredentials
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Custom MCP server connection test failed:', error)
        return false
      }

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Custom MCP server connection test failed:', error)
      return false
    }
  }
}

export function CustomMcpCredentialsForm({
  integration,
  onSaved,
  tempIntegrationId
}: CustomMcpCredentialsFormProps) {
  return (
    <BaseCredentialsForm
      config={customMcpConfig}
      integration={integration}
      onSaved={onSaved}
      tempIntegrationId={tempIntegrationId}
    />
  )
}