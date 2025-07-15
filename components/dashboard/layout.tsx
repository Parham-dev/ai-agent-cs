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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="lg:pl-72">
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <Header title={title} subtitle={subtitle} />
          
          {/* Main content */}
          <main className="flex-1 bg-gray-50 dark:bg-gray-950">
            <div className="px-6 py-6">
              {children}
            </div>
          </main>
          
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  )
}