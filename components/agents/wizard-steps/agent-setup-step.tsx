'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Bot, Lightbulb, Zap, Settings, Palette } from 'lucide-react'
import { StepProps } from './types'
import { INSTRUCTION_TEMPLATES, AI_MODELS } from './constants'

export function AgentSetupStep({ form }: StepProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const instructions = watch('instructions')
  const selectedTemplate = watch('instructionTemplate')
  const dynamicInstructions = watch('dynamicInstructions')
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
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Basic Information Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-3xl p-8 shadow-2xl">
          <div className="border-b border-gradient-to-r from-blue-200/50 to-purple-200/50 dark:from-blue-800/50 dark:to-purple-800/50 pb-6 mb-8">
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Basic Information
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 ml-16 text-lg">Configure your agent&apos;s fundamental details and identity</p>
          </div>

          <div className="space-y-6">
            {/* Agent Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-lg font-semibold text-gray-700 dark:text-gray-300">Agent Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Customer Support Bot"
                {...register('name')}
                className={`h-12 text-lg border-2 rounded-xl transition-all duration-300 ${
                  errors.name 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300'
                }`}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</span>
                  {typeof errors.name?.message === 'string' ? errors.name.message : 'Invalid input'}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-lg font-semibold text-gray-700 dark:text-gray-300">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this agent does..."
                {...register('description')}
                rows={4}
                className="border-2 border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-300 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300"
              />
            </div>

            <input type="hidden" {...register('organizationId', { value: 'cmd50brq20000jgtb8lqfol4o' })} />
          </div>
        </div>
      </div>

      {/* Instructions Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-3xl p-8 shadow-2xl">
          <div className="border-b border-gradient-to-r from-emerald-200/50 to-teal-200/50 dark:from-emerald-800/50 dark:to-teal-800/50 pb-6 mb-8">
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Instructions & Behavior
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 ml-16 text-lg">Define how your agent should behave and respond</p>
          </div>

          <div className="space-y-8">
            {/* Template Library */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Palette className="w-5 h-5 text-emerald-500" />
                <Label className="text-xl font-semibold text-gray-700 dark:text-gray-300">Choose a Template (Optional)</Label>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(INSTRUCTION_TEMPLATES).map(([key, template]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedTemplate === key
                        ? `${template.borderColor} ring-4 ring-opacity-30 scale-105 shadow-2xl`
                        : 'border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-102'
                    }`}
                    onClick={() => applyTemplate(key)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`p-4 rounded-2xl ${template.color}`}>
                          {template.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {template.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {template.description}
                          </p>
                        </div>
                        {selectedTemplate === key && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Instructions Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="instructions" className="text-xl font-semibold text-gray-700 dark:text-gray-300">System Instructions *</Label>
                <Badge variant="outline" className="text-sm px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                  {instructions?.length || 0} characters
                </Badge>
              </div>
              <Textarea
                id="instructions"
                placeholder="Write detailed instructions for your AI agent..."
                {...register('instructions')}
                rows={12}
                className={`font-mono text-base border-2 rounded-xl transition-all duration-300 ${
                  errors.instructions 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-300'
                }`}
              />
              {errors.instructions && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">!</span>
                  {typeof errors.instructions?.message === 'string' ? errors.instructions.message : 'Invalid input'}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl">
                These instructions define how your agent behaves, its personality, and its capabilities.
                Be specific and clear about what the agent should and shouldn&apos;t do.
              </p>
            </div>

            {/* Dynamic Instructions Toggle */}
            <Card className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-emerald-500" />
                      <Label htmlFor="dynamicInstructions" className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Dynamic Instructions
                      </Label>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Allow instructions to be modified based on context (user info, time, etc.)
                    </p>
                  </div>
                  <Switch
                    id="dynamicInstructions"
                    checked={dynamicInstructions}
                    onCheckedChange={(checked) => setValue('dynamicInstructions', checked)}
                    className="scale-125"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Model Configuration Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-orange-500/5 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-3xl p-8 shadow-2xl">
          <div className="border-b border-gradient-to-r from-purple-200/50 to-pink-200/50 dark:from-purple-800/50 dark:to-pink-800/50 pb-6 mb-8">
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                Model & Settings
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 ml-16 text-lg">Configure AI model and behavior parameters</p>
          </div>

          <div className="space-y-8">
            {/* Model Selection */}
            <div className="space-y-6">
              <Label className="text-xl font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                <span>AI Model</span>
                <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedModel} onValueChange={(value) => setValue('model', value)}>
                <SelectTrigger className="h-16 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-base">
                  <SelectValue placeholder="Select an AI model" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex flex-col space-y-1">
                        <span className="font-medium">{model.label}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 dark:text-gray-400 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl">
                Latest multimodal model, best performance
              </p>
            </div>

            {/* Temperature and Top P Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Temperature Setting */}
              <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                      <span>Temperature</span>
                    </Label>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-lg px-4 py-2 bg-white dark:bg-gray-800 border-purple-200 dark:border-purple-700">
                        {temperature}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="px-3">
                      <Slider
                        value={[temperature]}
                        onValueChange={(value) => setValue('temperature', value[0])}
                        min={0}
                        max={2}
                        step={0.1}
                        className="w-full [&>span[data-orientation=horizontal]]:bg-purple-200 [&>span[data-orientation=horizontal]]:h-2 [&>span[data-orientation=horizontal]>span]:bg-gradient-to-r [&>span[data-orientation=horizontal]>span]:from-purple-500 [&>span[data-orientation=horizontal]>span]:to-pink-500 [&>span[role=slider]]:bg-gradient-to-r [&>span[role=slider]]:from-purple-500 [&>span[role=slider]]:to-pink-500 [&>span[role=slider]]:border-2 [&>span[role=slider]]:border-white [&>span[role=slider]]:shadow-lg [&>span[role=slider]]:w-5 [&>span[role=slider]]:h-5"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 font-medium px-3">
                      <span>Focused</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                    Controls randomness. Lower values (0.1-0.5) for focused responses, higher values (1.0-2.0) for creative responses.
                  </p>
                </CardContent>
              </Card>

              {/* Top P Setting */}
              <Card className="border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                      <span>Top P</span>
                    </Label>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-lg px-4 py-2 bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700">
                        {topP}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="px-3">
                      <Slider
                        value={[topP]}
                        onValueChange={(value) => setValue('topP', value[0])}
                        min={0}
                        max={1}
                        step={0.05}
                        className="w-full [&>span[data-orientation=horizontal]]:bg-blue-200 [&>span[data-orientation=horizontal]]:h-2 [&>span[data-orientation=horizontal]>span]:bg-gradient-to-r [&>span[data-orientation=horizontal]>span]:from-blue-500 [&>span[data-orientation=horizontal]>span]:to-indigo-500 [&>span[role=slider]]:bg-gradient-to-r [&>span[role=slider]]:from-blue-500 [&>span[role=slider]]:to-indigo-500 [&>span[role=slider]]:border-2 [&>span[role=slider]]:border-white [&>span[role=slider]]:shadow-lg [&>span[role=slider]]:w-5 [&>span[role=slider]]:h-5"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 font-medium px-3">
                      <span>Restricted</span>
                      <span>Diverse</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                    Controls diversity via nucleus sampling. 1.0 means no restriction.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tool Choice */}
            <div className="space-y-6">
              <Label className="text-xl font-semibold text-gray-700 dark:text-gray-300">Tool Usage Behavior</Label>
              <Select value={toolChoice} onValueChange={(value) => setValue('toolChoice', value)}>
                <SelectTrigger className="h-16 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  <SelectItem value="auto" className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800">Auto - Model decides when to use tools</SelectItem>
                  <SelectItem value="required" className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800">Required - Model must use a tool</SelectItem>
                  <SelectItem value="none" className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800">None - Model cannot use tools</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 dark:text-gray-400 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl">
                Auto mode will automatically decide when to use tools
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
