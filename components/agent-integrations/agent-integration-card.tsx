/**
 * Agent Integration Card Component
 * Displays an integration that can be connected to an agent
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, ChevronDown, ChevronUp } from 'lucide-react'
import type { ApiIntegration, ApiAgentIntegration } from '@/lib/types'

interface AgentIntegrationCardProps {
  integration: ApiIntegration
  agentIntegration?: ApiAgentIntegration
  isConnected: boolean
  onToggleConnection: (integrationId: string, connect: boolean) => Promise<void>
  onConfigureTools: (integrationId: string) => void
  loading?: boolean
}

export function AgentIntegrationCard({
  integration,
  agentIntegration,
  isConnected,
  onToggleConnection,
  onConfigureTools,
  loading = false
}: AgentIntegrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [toggling, setToggling] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onToggleConnection(integration.id, !isConnected)
    } finally {
      setToggling(false)
    }
  }

  const selectedToolsCount = agentIntegration?.selectedTools?.length || 0

  return (
    <Card className={`transition-all duration-200 ${isConnected ? 'border-green-200 bg-green-50/50' : 'border-border'}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">
                  {integration.type.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {integration.type} integration
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={integration.isActive ? 'default' : 'secondary'}>
              {integration.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <input
              type="checkbox"
              checked={isConnected}
              onChange={handleToggle}
              disabled={loading || toggling || !integration.isActive}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isConnected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Tools configured:</span>
                <Badge variant="outline">{selectedToolsCount}</Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onConfigureTools(integration.id)}
                  disabled={loading}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Tools
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {isExpanded && agentIntegration && (
              <div className="border-t pt-3 mt-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={agentIntegration.isEnabled ? 'default' : 'secondary'}>
                      {agentIntegration.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Connected:</span>
                    <span>{new Date(agentIntegration.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {agentIntegration.selectedTools && agentIntegration.selectedTools.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Selected Tools:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agentIntegration.selectedTools.map(tool => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!isConnected && integration.description && (
          <p className="text-sm text-muted-foreground">
            {integration.description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}