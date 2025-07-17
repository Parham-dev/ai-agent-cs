"use client"

import { createTheme, MantineProvider, MantineColorScheme } from '@mantine/core'
import { useColorScheme, useLocalStorage } from '@mantine/hooks'
import { ReactNode, createContext, useContext, useEffect } from 'react'

// Create Mantine theme
const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    // Custom brand colors that work with your existing design
    brand: [
      '#f0f9ff',
      '#e0f2fe', 
      '#bae6fd',
      '#7dd3fc',
      '#38bdf8',
      '#0ea5e9',
      '#0284c7',
      '#0369a1',
      '#075985',
      '#0c4a6e'
    ],
  },
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em', 
    lg: '75em',
    xl: '88em',
  },
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
})

// Theme context for managing color scheme
interface ThemeContextType {
  colorScheme: MantineColorScheme
  setColorScheme: (scheme: MantineColorScheme) => void
  toggleColorScheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within MantineThemeProvider')
  }
  return context
}

interface MantineThemeProviderProps {
  children: ReactNode
}

export function MantineThemeProvider({ children }: MantineThemeProviderProps) {
  const preferredColorScheme = useColorScheme()
  const [colorScheme, setColorScheme] = useLocalStorage<MantineColorScheme>({
    key: 'mantine-color-scheme',
    defaultValue: 'auto',
    getInitialValueInEffect: true,
  })

  // Sync with system preference when in auto mode
  useEffect(() => {
    if (colorScheme === 'auto') {
      const root = document.documentElement
      if (preferredColorScheme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
    } else {
      const root = document.documentElement
      if (colorScheme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
    }
  }, [colorScheme, preferredColorScheme])

  const toggleColorScheme = () => {
    setColorScheme(current => {
      if (current === 'light') return 'dark'
      if (current === 'dark') return 'auto'
      return 'light'
    })
  }

  const themeContextValue: ThemeContextType = {
    colorScheme,
    setColorScheme,
    toggleColorScheme,
  }

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <MantineProvider 
        theme={theme} 
        defaultColorScheme={colorScheme}
        forceColorScheme={colorScheme === 'auto' ? undefined : colorScheme}
      >
        {children}
      </MantineProvider>
    </ThemeContext.Provider>
  )
}
