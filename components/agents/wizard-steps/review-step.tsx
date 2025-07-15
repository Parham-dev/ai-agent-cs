'use client'

import { StepProps } from './types'

export function ReviewStep({ form }: StepProps) {
  const { watch } = form
  const formData = watch()

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 rounded-3xl blur-xl"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center py-20">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-4">
              Review & Deploy
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Review your agent configuration and deploy
            </p>
            <div className="text-left max-w-2xl mx-auto space-y-4">
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-4 rounded-xl">
                <p className="font-semibold">Agent Name:</p>
                <p>{formData.name || 'Not set'}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 p-4 rounded-xl">
                <p className="font-semibold">Model:</p>
                <p>{formData.model || 'Not selected'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
