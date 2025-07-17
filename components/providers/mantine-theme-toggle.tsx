"use client"

import { ActionIcon, Tooltip } from '@mantine/core'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useThemeContext } from './mantine-theme-provider'

export function MantineThemeToggle() {
  const { colorScheme, toggleColorScheme } = useThemeContext()

  const getIcon = () => {
    if (colorScheme === 'light') return <Sun size={18} />
    if (colorScheme === 'dark') return <Moon size={18} />
    return <Monitor size={18} />
  }

  const getTooltip = () => {
    if (colorScheme === 'light') return 'Switch to dark mode'
    if (colorScheme === 'dark') return 'Switch to system mode'
    return 'Switch to light mode'
  }

  return (
    <Tooltip label={getTooltip()} position="bottom">
      <ActionIcon
        onClick={toggleColorScheme}
        variant="subtle"
        size="lg"
        aria-label="Toggle theme"
      >
        {getIcon()}
      </ActionIcon>
    </Tooltip>
  )
}
