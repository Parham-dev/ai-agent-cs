'use client';

import { DashboardLayout } from '@/components/dashboard/layout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Bot, Plug, Building2, Plus } from 'lucide-react'

export default function HomePage() {
  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Manage your AI agents and integrations"
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Agents</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Integrations</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <Plug className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organizations</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Agents</h3>
              <Link 
                href="/agents"
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                View all
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create and manage your AI customer service agents
            </p>
            <Link 
              href="/agents/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Agent
            </Link>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Integrations</h3>
              <span className="text-gray-400 text-sm">Coming soon</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connect to your business platforms and tools
            </p>
            <button 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
              disabled
            >
              <Plus className="h-4 w-4" />
              Add Integration
            </button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
