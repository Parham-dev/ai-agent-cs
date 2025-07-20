import { NextRequest } from 'next/server'
import { ApiResponseHelper as Api, validateMethod, withErrorHandling } from '@/lib/api/helpers'
import { costCalculatorService } from '@/lib/services/cost-calculator.service'

/**
 * Get available AI models
 * Public endpoint - no authentication required
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  // Get models from cost calculator service (same source as constants)
  const availableModels = costCalculatorService.getAvailableModels()
  const modelPricing = costCalculatorService.getModelPricing()
  
  const models = availableModels.map(model => ({
    value: model.value,
    label: model.label,
    description: model.description,
    // Add pricing information if available
    pricing: modelPricing[model.value as keyof typeof modelPricing] || null
  }))

  return Api.success(models);
});