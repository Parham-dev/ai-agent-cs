'use client'

import { StepProps } from './types'

export function ToolsStep({ }: StepProps) {
  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center py-20">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
              Tools Configuration
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Coming soon - Configure agent tools and capabilities
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
