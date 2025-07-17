"use client"

import { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Footer } from './footer'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))'
      }}
    >
      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <Header title={title} subtitle={subtitle} />
      </div>

      {/* Main layout with sidebar and content */}
      <div style={{ display: 'flex', flex: 1, paddingTop: '80px', paddingBottom: '40px' }}>
        {/* Sidebar */}
        <div 
          style={{ 
            width: '280px',
            position: 'fixed',
            top: '80px',
            bottom: '40px',
            left: 0,
            zIndex: 90
          }}
          className="hidden lg:block"
        >
          <Sidebar />
        </div>

        {/* Main content */}
        <div 
          style={{ 
            flex: 1,
            marginLeft: '280px',
            padding: 'var(--mantine-spacing-lg)',
            paddingBottom: '2rem', // Additional padding for content spacing
            minHeight: 'calc(100vh - 120px)', // Full height minus header (80px) and footer (40px)
            overflowY: 'auto'
          }}
          className="lg:ml-[280px] ml-0"
        >
          {children}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
        <Footer />
      </div>
    </div>
  )
}