import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Check, Settings, Power } from 'lucide-react'
import type { IntegrationCredentials } from '@/lib/types/integrations'

export interface ConfiguredIntegration {
  id: string
  name: string
  type: string  // Integration type (e.g., 'shopify', 'stripe')
  icon: React.ReactNode
  color: string
  credentials: IntegrationCredentials
  selectedTools: string[]
  isConnected: boolean
}

export interface IntegrationDisplayItem {
  id: string
  name: string
  type: string
  icon: React.ReactNode
  color: string
  status: 'configured' | 'available' | 'coming-soon'
  isEnabled: boolean
  isConnected: boolean
  selectedToolsCount: number
  existsInDatabase: boolean
  credentials?: IntegrationCredentials
}

interface IntegrationsGridProps {
  integrations: IntegrationDisplayItem[]
  onAddIntegration: () => void
  onToggleIntegration: (integrationId: string, enabled: boolean) => void
  onEditIntegration: (integrationId: string) => void
}

export function IntegrationsGrid({ 
  integrations, 
  onAddIntegration,
  onToggleIntegration,
  onEditIntegration
}: IntegrationsGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {integrations.map((integration) => (
        <Card key={integration.id} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${
                integration.isEnabled 
                  ? 'bg-green-100 dark:bg-green-900/20' 
                  : 'bg-muted'
              }`}>
                <div className={`w-5 h-5 flex items-center justify-center ${
                  integration.isEnabled 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-muted-foreground'
                }`}>
                  {integration.icon}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold">
                  {integration.name}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  Connect to your {integration.name} store for product management
                </p>
              </div>
            </div>
            
            <Badge variant={integration.isEnabled ? 'default' : 'secondary'}>
              {integration.isEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Connection:</span>
              <div className="flex items-center space-x-2">
                {integration.isConnected && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
                {!integration.isConnected && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                    Not Connected
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tools:</span>
              <span>{integration.selectedToolsCount} configured</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex items-center space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onToggleIntegration(integration.type, !integration.isEnabled)}
                className={integration.isEnabled ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                title={integration.isEnabled ? 'Disable integration' : 'Enable integration'}
              >
                <Power className="h-4 w-4" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEditIntegration(integration.type)}
                title="Configure integration"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {integration.isEnabled ? 'Ready for use' : 'Click power to enable'}
            </div>
          </div>
        </Card>
      ))}
      
      {/* Add Integration Button */}
      <Card 
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
        onClick={onAddIntegration}
      >
        <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[160px]">
          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 mb-4">
            <Plus className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Add Integration
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Connect to external services
          </p>
        </CardContent>
      </Card>
    </div>
  )
}