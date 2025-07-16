import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Check } from 'lucide-react'
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

interface IntegrationsGridProps {
  configuredIntegrations: ConfiguredIntegration[]
  onAddIntegration: () => void
  onDeleteIntegration: (integrationId: string) => void
}

export function IntegrationsGrid({ 
  configuredIntegrations, 
  onAddIntegration, 
  onDeleteIntegration 
}: IntegrationsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {configuredIntegrations.map((integration) => (
        <Card key={integration.id} className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${integration.color} text-white shadow-lg`}>
                {integration.icon}
              </div>
              <div className="flex items-center space-x-2">
                {integration.isConnected && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteIntegration(integration.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {integration.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {integration.selectedTools.length} tools enabled
            </p>
          </CardContent>
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
