import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, AlertCircle, HelpCircle, ExternalLink } from 'lucide-react'
import { AVAILABLE_INTEGRATIONS } from './integration-select-modal'
import type { ConfiguredIntegration } from './integrations-grid'
import type { IntegrationCredentials } from '@/lib/types/integrations'

interface IntegrationTool {
  id: string
  name: string
  description: string
}

interface IntegrationConfigurationProps {
  selectedIntegration: string
  existingConfiguration?: {
    type: string
    credentials: IntegrationCredentials
    selectedTools: string[]
    isConnected: boolean
    settings?: Record<string, unknown>
  } | null
  onCancel: () => void
  onSave: (integration: Omit<ConfiguredIntegration, 'id' | 'name' | 'icon' | 'color'>) => void
}

// Custom hook to fetch available tools for an integration
function useIntegrationTools(integrationType: string) {
  const [tools, setTools] = useState<IntegrationTool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchTools = async () => {
      if (!integrationType) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/v2/integrations/tools?type=${integrationType}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch tools: ${response.statusText}`)
        }
        
        const data = await response.json()
        if (mounted) {
          setTools(data.data?.tools || [])
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch tools')
          // Fallback to hardcoded tools if API fails
          const fallbackIntegration = AVAILABLE_INTEGRATIONS.find(i => i.id === integrationType)
          setTools(fallbackIntegration?.tools || [])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchTools()

    return () => {
      mounted = false
    }
  }, [integrationType])

  return { tools, loading, error }
}

export function IntegrationConfiguration({ 
  selectedIntegration, 
  existingConfiguration,
  onCancel, 
  onSave 
}: IntegrationConfigurationProps) {
  const [configStep, setConfigStep] = useState<'credentials' | 'tools'>('credentials')
  const [credentials, setCredentials] = useState<IntegrationCredentials>(existingConfiguration?.credentials || {})
  const [selectedTools, setSelectedTools] = useState<string[]>(existingConfiguration?.selectedTools || [])
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>(
    existingConfiguration?.isConnected ? 'success' : 'idle'
  )

  // Fetch available tools for this integration
  const { tools: availableTools, loading: toolsLoading, error: toolsError } = useIntegrationTools(selectedIntegration)

  // Update state when existingConfiguration changes
  useEffect(() => {
    if (existingConfiguration) {
      setCredentials(existingConfiguration.credentials || {})
      setSelectedTools(existingConfiguration.selectedTools || [])
      setConnectionStatus(existingConfiguration.isConnected ? 'success' : 'idle')
    } else {
      setCredentials({})
      setSelectedTools([])
      setConnectionStatus('idle')
    }
  }, [existingConfiguration])

  const currentIntegration = AVAILABLE_INTEGRATIONS.find(i => i.id === selectedIntegration)
  if (!currentIntegration) return null

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setConnectionStatus('success')
    setIsTestingConnection(false)
  }

  const handleSaveIntegration = () => {
    onSave({
      type: selectedIntegration,
      credentials,
      selectedTools,
      isConnected: connectionStatus === 'success'
    })
  }

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter(id => id !== toolId))
    } else {
      setSelectedTools([...selectedTools, toolId])
    }
  }

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800">
      <CardContent className="p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${currentIntegration.color} text-white shadow-lg`}>
            {currentIntegration.icon}
          </div>
          <div>
            <h4 className="text-2xl font-bold">{currentIntegration.name} Setup</h4>
            <p className="text-gray-600 dark:text-gray-400">Configure your integration</p>
          </div>
        </div>

        {configStep === 'credentials' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                <span className="font-semibold">Credentials</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center space-x-2 opacity-50">
                <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm">2</div>
                <span>Select Tools</span>
              </div>
            </div>

            {currentIntegration.id === 'shopify' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="shopUrl">Shop URL</Label>
                    <Input
                      id="shopUrl"
                      placeholder="your-store.myshopify.com"
                      value={credentials.shopUrl || ''}
                      onChange={(e) => setCredentials({...credentials, shopUrl: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accessToken">Admin API Access Token</Label>
                    <Input
                      id="accessToken"
                      type="password"
                      placeholder="shpat_..."
                      value={credentials.accessToken || ''}
                      onChange={(e) => setCredentials({...credentials, accessToken: e.target.value})}
                    />
                  </div>
                  <Button
                    onClick={handleTestConnection}
                    disabled={!credentials.shopUrl || !credentials.accessToken || isTestingConnection}
                    className="w-full"
                  >
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                  {connectionStatus === 'success' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Connection successful!</span>
                    </div>
                  )}
                  {connectionStatus === 'error' && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Connection failed. Please check your credentials.</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                  <h5 className="font-semibold mb-3 flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    How to get your credentials
                  </h5>
                  <ol className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                    <li>1. Go to your Shopify admin panel</li>
                    <li>2. Navigate to Apps → App and sales channel settings</li>
                    <li>3. Click &ldquo;Develop apps&rdquo; → &ldquo;Create an app&rdquo;</li>
                    <li>4. Configure Admin API access scopes</li>
                    <li>5. Install the app and copy the access token</li>
                  </ol>
                  <Button variant="outline" size="sm" className="mt-4">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Documentation
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => setConfigStep('tools')}
                disabled={connectionStatus !== 'success'}
              >
                Next: Select Tools
              </Button>
            </div>
          </div>
        )}

        {configStep === 'tools' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2 opacity-50">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                  <Check className="w-4 h-4" />
                </div>
                <span>Credentials</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                <span className="font-semibold">Select Tools</span>
              </div>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-4">Choose which tools to enable for your agent</h5>
              {toolsLoading ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading available tools...</p>
              ) : toolsError ? (
                <p className="text-sm text-red-600 dark:text-red-400">Error loading tools: {toolsError}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableTools.map((tool) => (
                    <Card 
                      key={tool.id} 
                      className={`border cursor-pointer transition-colors ${
                        selectedTools.includes(tool.id) 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`} 
                      onClick={() => toggleTool(tool.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center mt-0.5 ${
                            selectedTools.includes(tool.id) 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {selectedTools.includes(tool.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <h6 className="font-medium mb-1">{tool.name}</h6>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={() => setConfigStep('credentials')}>
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSaveIntegration}
                disabled={selectedTools.length === 0}
              >
                Save Integration
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
