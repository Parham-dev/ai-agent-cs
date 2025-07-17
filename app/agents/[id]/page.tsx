'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Bot, 
  Edit, 
  Trash2, 
  Power, 
  MessageSquare, 
  Settings, 
  Copy,
  Calendar,
  Brain,
  Wrench,
  Plug
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { AgentIntegrationsManager } from '@/components/agent-integrations'
import { toast } from 'sonner'
import type { ApiAgent } from '@/lib/types'

export default function AgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [agent, setAgent] = useState<ApiAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  const fetchAgent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const agentData = await apiClient.getAgent(agentId)
      setAgent(agentData)
    } catch (err) {
      console.error('Failed to fetch agent:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch agent')
    } finally {
      setLoading(false)
    }
  }, [agentId])

  const handleToggleStatus = async () => {
    if (!agent) return
    
    try {
      setIsTogglingStatus(true)
      const updatedAgent = await apiClient.updateAgent(agent.id, { 
        isActive: !agent.isActive 
      })
      setAgent(updatedAgent)
      toast.success(`Agent ${updatedAgent.isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
      console.error('Failed to toggle agent status:', err)
      toast.error('Failed to update agent status')
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!agent) return
    
    if (!confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await apiClient.deleteAgent(agent.id)
      toast.success('Agent deleted successfully')
      router.push('/agents')
    } catch (err) {
      console.error('Failed to delete agent:', err)
      toast.error('Failed to delete agent')
    }
  }

  const copyAgentId = () => {
    navigator.clipboard.writeText(agent?.id || '')
    toast.success('Agent ID copied to clipboard')
  }

  useEffect(() => {
    if (agentId) {
      fetchAgent()
    }
  }, [agentId, fetchAgent])

  if (loading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Fetching agent details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !agent) {
    return (
      <DashboardLayout title="Error" subtitle="Failed to load agent">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Bot className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Agent not found</h3>
            <p className="text-muted-foreground">{error || 'The requested agent could not be found.'}</p>
          </div>
          <Button asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout 
      title={agent.name} 
      subtitle={`Agent details and configuration`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/agents" className="inline-flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Agents</span>
              </Link>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Badge variant={agent.isActive ? "default" : "secondary"}>
                {agent.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {agent.model}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
            >
              <Power className="h-4 w-4 mr-2" />
              {agent.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            
            <Button variant="outline" size="sm" asChild>
              <Link href={`/agents/${agent.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>Instructions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm">{agent.systemPrompt || 'No system prompt configured'}</pre>
                </div>
              </CardContent>
            </Card>

            {/* Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5" />
                  <span>Tools</span>
                  <Badge variant="outline">0</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Tools are now managed through integrations</p>
              </CardContent>
            </Card>

            {/* Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plug className="h-5 w-5" />
                  <span>Integrations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agent && <AgentIntegrationsManager agentId={agent.id} agentName={agent.name} />}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>Agent Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Agent ID</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                      {agent.id}
                    </code>
                    <Button variant="ghost" size="sm" onClick={copyAgentId}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Model</label>
                  <p className="font-mono text-sm mt-1">{agent.model}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={agent.isActive ? "default" : "secondary"}>
                      {agent.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Integrations</label>
                  <p className="text-sm mt-1">{agent.integrations?.length || 0}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Timestamps</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm mt-1">
                    {new Date(agent.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm mt-1">
                    {new Date(agent.updatedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href={`/chat/${agent.id}`}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Test Chat
                  </Link>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href={`/agents/${agent.id}/edit`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
