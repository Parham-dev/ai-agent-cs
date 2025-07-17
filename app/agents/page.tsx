'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bot, 
  Plus, 
  Search, 
  Power,
  Edit,
  Trash2,
  MessageSquare,
  Eye
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import type { ApiAgent } from '@/lib/types'

export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<ApiAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchAgents = async () => {
    try {
      setLoading(true)
      setError(null)
      const agentsData = await apiClient.getAgents()
      setAgents(agentsData)
    } catch (err) {
      console.error('Failed to fetch agents:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch agents')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (agent: ApiAgent) => {
    try {
      setActionLoading(agent.id)
      const updatedAgent = await apiClient.updateAgent(agent.id, { 
        isActive: !agent.isActive 
      })
      
      // Update local state
      setAgents(prev => prev.map(a => 
        a.id === agent.id ? updatedAgent : a
      ))
      
      toast.success(`Agent ${updatedAgent.isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
      console.error('Failed to toggle agent status:', err)
      toast.error('Failed to update agent status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (agent: ApiAgent) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setActionLoading(agent.id)
      await apiClient.deleteAgent(agent.id)
      
      // Remove from local state
      setAgents(prev => prev.filter(a => a.id !== agent.id))
      
      toast.success('Agent deleted successfully')
    } catch (err) {
      console.error('Failed to delete agent:', err)
      toast.error('Failed to delete agent')
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.systemPrompt && agent.systemPrompt.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.description && agent.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <DashboardLayout title="Agents" subtitle="Manage your AI customer service agents">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading agents...</p>
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
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={fetchAgents}>
            Try Again
          </Button>
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <Button asChild>
            <Link href="/agents/new" className="inline-flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Agent</span>
            </Link>
          </Button>
        </div>

        {/* Agents Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">
                  {agents.length}
                </p>
              </div>
              <Bot className="h-8 w-8 text-primary" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold">
                  {agents.filter(a => a.isActive).length}
                </p>
              </div>
              <Power className="h-8 w-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Integrations</p>
                <p className="text-2xl font-bold">
                  {agents.reduce((sum, agent) => sum + (agent.integrations?.length || 0), 0)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Agents List */}
        {filteredAgents.length === 0 ? (
          <Card className="p-12 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No agents found' : 'No agents yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? `No agents match "${searchTerm}". Try adjusting your search.`
                : 'Create your first AI agent to start handling customer inquiries.'
              }
            </p>
            {!searchTerm && (
              <Button asChild size="lg">
                <Link href="/agents/new" className="inline-flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Agent</span>
                </Link>
              </Button>
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
                        : 'bg-muted'
                    }`}>
                      <Bot className={`h-5 w-5 ${
                        agent.isActive 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <Link 
                        href={`/agents/${agent.id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {agent.name}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {agent.systemPrompt || agent.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  
                  <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Model:</span>
                    <Badge variant="outline">{agent.model}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tools:</span>
                    <span>Via integrations</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Integrations:</span>
                    <span>{agent.integrations?.length || 0} connected</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/agents/${agent.id}`)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(agent)}
                      disabled={actionLoading === agent.id}
                      className={agent.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                      title={agent.isActive ? 'Deactivate agent' : 'Activate agent'}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/agents/${agent.id}/edit`)}
                      title="Edit agent"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/chat/${agent.id}`)}
                      title="Test chat"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(agent)}
                    disabled={actionLoading === agent.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete agent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}