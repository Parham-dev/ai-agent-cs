'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  Plus, 
  Search, 
  MoreVertical, 
  Power,
  Edit,
  Trash2,
  MessageSquare,
  Settings
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  instructions: string
  tools: string[]
  model: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    conversations: number
  }
  organization?: {
    name: string
    slug: string
  }
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agents')
      
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }
      
      const data = await response.json()
      setAgents(data.agents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.instructions.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleAgentStatus = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/toggle`, {
        method: 'PATCH'
      })
      
      if (!response.ok) {
        throw new Error('Failed to toggle agent status')
      }
      
      // Refresh agents list
      await fetchAgents()
    } catch (err) {
      console.error('Error toggling agent status:', err)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Agents" subtitle="Manage your AI customer service agents">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading agents...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Agents" subtitle="Manage your AI customer service agents">
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Bot className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Agents</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          </div>
          <button
            onClick={fetchAgents}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Agents" subtitle="Manage your AI customer service agents">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="h-4 w-4" />
            <span>Create Agent</span>
          </button>
        </div>

        {/* Agents Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {agents.length}
                </p>
              </div>
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {agents.filter(a => a.isActive).length}
                </p>
              </div>
              <Power className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {agents.reduce((sum, agent) => sum + (agent._count?.conversations || 0), 0)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Agents List */}
        {filteredAgents.length === 0 ? (
          <Card className="p-12 text-center">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No agents found' : 'No agents yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm 
                ? `No agents match "${searchTerm}". Try adjusting your search.`
                : 'Create your first AI agent to start handling customer inquiries.'
              }
            </p>
            {!searchTerm && (
              <button className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors">
                <Plus className="h-4 w-4" />
                <span>Create Your First Agent</span>
              </button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      agent.isActive 
                        ? 'bg-green-100 dark:bg-green-900/20' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Bot className={`h-5 w-5 ${
                        agent.isActive 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {agent.instructions}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={agent.isActive ? 'success' : 'secondary'}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Model:</span>
                    <Badge variant="outline">{agent.model}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tools:</span>
                    <span className="text-gray-900 dark:text-white">
                      {agent.tools.length} configured
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Conversations:</span>
                    <span className="text-gray-900 dark:text-white">
                      {agent._count?.conversations || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAgentStatus(agent.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        agent.isActive
                          ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
                          : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400'
                      }`}
                      title={agent.isActive ? 'Deactivate agent' : 'Activate agent'}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    
                    <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400">
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400">
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}