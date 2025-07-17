/**
 * Tool Selection Dialog Component
 * Allows users to select which tools from an integration an agent can use
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Wrench } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'
import type { IntegrationTool } from '@/lib/types'

interface ToolSelectionDialogProps {
  integrationId: string
  currentTools: string[]
  onSave: (integrationId: string, selectedTools: string[]) => Promise<void>
  onClose: () => void
}

export function ToolSelectionDialog({
  integrationId,
  currentTools,
  onSave,
  onClose
}: ToolSelectionDialogProps) {
  const [availableTools, setAvailableTools] = useState<IntegrationTool[]>([])
  const [selectedTools, setSelectedTools] = useState<string[]>(currentTools)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [integrationType, setIntegrationType] = useState<string>('')

  useEffect(() => {
    const fetchTools = async () => {
      try {
        setLoading(true)
        
        // Get integration details to determine type
        const integration = await apiClient.getIntegration(integrationId)
        setIntegrationType(integration.type)
        
        // Get available tools for this integration type
        const tools = await apiClient.getIntegrationTools(integration.type)
        setAvailableTools(tools)
      } catch (error) {
        console.error('Failed to fetch tools:', error)
        toast.error('Failed to load available tools')
      } finally {
        setLoading(false)
      }
    }

    fetchTools()
  }, [integrationId])

  const handleToolToggle = (toolName: string, checked: boolean) => {
    setSelectedTools(prev => 
      checked 
        ? [...prev, toolName]
        : prev.filter(name => name !== toolName)
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(integrationId, selectedTools)
      onClose()
    } catch (error) {
      console.error('Failed to save tools:', error)
      toast.error('Failed to save tool configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectAll = () => {
    setSelectedTools(availableTools.map(tool => tool.name))
  }

  const handleSelectNone = () => {
    setSelectedTools([])
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wrench className="w-5 h-5" />
              <span className="font-semibold">Configure Tools</span>
              <Badge variant="outline" className="ml-2">
                {integrationType}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Select which tools this agent can use from this integration
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={loading}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectNone}
                disabled={loading}
              >
                Select None
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Selected:</span>
              <Badge variant="default">{selectedTools.length}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Available:</span>
              <Badge variant="outline">{availableTools.length}</Badge>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto pr-4">
              <div className="space-y-3">
                {availableTools.map((tool) => (
                  <Card key={tool.name} className="p-0">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={tool.name}
                          checked={selectedTools.includes(tool.name)}
                          onChange={(e) => 
                            handleToolToggle(tool.name, e.target.checked)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <label 
                            htmlFor={tool.name}
                            className="font-medium cursor-pointer block"
                          >
                            {tool.name}
                          </label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {tool.description}
                          </p>
                          {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Parameters:</p>
                              <div className="flex flex-wrap gap-1">
                                {Object.keys(tool.parameters).map((param) => (
                                  <Badge key={param} variant="secondary" className="text-xs">
                                    {param}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!loading && availableTools.length === 0 && (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tools available</h3>
              <p className="text-muted-foreground">
                This integration doesn&apos;t have any tools configured yet.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}