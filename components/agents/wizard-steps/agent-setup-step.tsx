'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Bot, Lightbulb, Settings } from 'lucide-react'
import { StepProps } from './types'
import { INSTRUCTION_TEMPLATES, AI_MODELS } from './constants'

export function AgentSetupStep({ form }: StepProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const instructions = watch('instructions')
  const selectedTemplate = watch('instructionTemplate')
  const selectedModel = watch('model')
  const temperature = watch('temperature')
  const topP = watch('topP')
  const toolChoice = watch('toolChoice')

  const applyTemplate = (templateKey: string) => {
    const template = INSTRUCTION_TEMPLATES[templateKey as keyof typeof INSTRUCTION_TEMPLATES]
    if (template) {
      setValue('instructions', template.instructions)
      setValue('instructionTemplate', templateKey)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name + Model stacked in left column, Description spans right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column: Name and Model stacked */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Agent Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support Bot"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">
                    {typeof errors.name?.message === 'string' ? errors.name.message : 'Invalid input'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">AI Model *</Label>
                <Select value={selectedModel} onValueChange={(value) => setValue('model', value)}>
                  <SelectTrigger className="bg-background w-full">
                    <SelectValue placeholder="Select an AI model" />
                  </SelectTrigger>
                  <SelectContent className="bg-background dark:bg-gray-900 border shadow-lg w-full">
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-gray-500">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Right column: Description spanning full height */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this agent does..."
                {...register('description')}
                rows={6}
                className="resize-none h-full min-h-[140px]"
              />
            </div>
          </div>
          
          <input type="hidden" {...register('organizationId', { value: 'cmd50brq20000jgtb8lqfol4o' })} />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5" />
            Instructions & Behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection - Compact Grid */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Templates (Optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(INSTRUCTION_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyTemplate(key)}
                  className={`p-3 text-left border rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedTemplate === key
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {template.icon}
                    </div>
                    <span className="font-medium text-sm">{template.title}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="instructions" className="text-sm font-medium">System Instructions *</Label>
              <Badge variant="outline" className="text-xs">
                {instructions?.length || 0} characters
              </Badge>
            </div>
            <Textarea
              id="instructions"
              placeholder="Write detailed instructions for your AI agent..."
              {...register('instructions')}
              rows={8}
              className={`font-mono text-sm ${errors.instructions ? 'border-red-500' : ''}`}
            />
            {errors.instructions && (
              <p className="text-sm text-red-500">
                {typeof errors.instructions?.message === 'string' ? errors.instructions.message : 'Invalid input'}
              </p>
            )}
            <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded">
              Define how your agent behaves, its personality, and capabilities. Be specific about what it should and shouldn&apos;t do.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Model Configuration */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5" />
            Model Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* All three controls in one row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Temperature */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Temperature</Label>
                <Badge variant="outline" className="text-xs">{temperature}</Badge>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={(value) => setValue('temperature', value[0])}
                min={0}
                max={2}
                step={0.1}
                className="w-full [&>span[data-orientation=horizontal]]:bg-gray-200 dark:[&>span[data-orientation=horizontal]]:bg-gray-700 [&>span[data-orientation=horizontal]]:h-2 [&>span[data-orientation=horizontal]>span]:bg-blue-600 dark:[&>span[data-orientation=horizontal]>span]:bg-blue-400 [&>span[role=slider]]:bg-blue-600 dark:[&>span[role=slider]]:bg-blue-400 [&>span[role=slider]]:border-2 [&>span[role=slider]]:border-white dark:[&>span[role=slider]]:border-gray-900"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Focused</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Top P */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Top P</Label>
                <Badge variant="outline" className="text-xs">{topP}</Badge>
              </div>
              <Slider
                value={[topP]}
                onValueChange={(value) => setValue('topP', value[0])}
                min={0}
                max={1}
                step={0.05}
                className="w-full [&>span[data-orientation=horizontal]]:bg-gray-200 dark:[&>span[data-orientation=horizontal]]:bg-gray-700 [&>span[data-orientation=horizontal]]:h-2 [&>span[data-orientation=horizontal]>span]:bg-green-600 dark:[&>span[data-orientation=horizontal]>span]:bg-green-400 [&>span[role=slider]]:bg-green-600 dark:[&>span[role=slider]]:bg-green-400 [&>span[role=slider]]:border-2 [&>span[role=slider]]:border-white dark:[&>span[role=slider]]:border-gray-900"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Restricted</span>
                <span>Diverse</span>
              </div>
            </div>

            {/* Tool Choice */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tool Usage</Label>
              <Select value={toolChoice} onValueChange={(value) => setValue('toolChoice', value)}>
                <SelectTrigger className="bg-background w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background dark:bg-gray-900 border shadow-lg w-full">
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500">
                Model tool behavior
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}