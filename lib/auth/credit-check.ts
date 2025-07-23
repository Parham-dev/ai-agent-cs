/**
 * Credit Check Middleware
 * Validates organization has sufficient credits before processing requests
 */

import { NextResponse } from 'next/server'
import { organizationCreditsService } from '@/lib/database/services/organization-credits.service'
import { userPricingService } from '@/lib/services/user-pricing.service'
import { costCalculatorService } from '@/lib/services/cost-calculator.service'
import { ApiResponseHelper as Api } from '@/lib/api/helpers'
import type { AuthContext } from '@/lib/types/auth'

export interface CreditCheckOptions {
  /**
   * Estimated tokens for the request (for pre-flight checks)
   */
  estimatedTokens?: number
  
  /**
   * Model to use for cost estimation
   */
  model?: string
  
  /**
   * Whether to bypass credit check (for admin operations)
   */
  bypassForAdmin?: boolean
  
  /**
   * Custom error message for insufficient credits
   */
  errorMessage?: string
  
  /**
   * Minimum credit balance required (defaults to estimated cost)
   */
  minimumBalance?: number
}

/**
 * Check if organization has sufficient credits
 */
export async function checkOrganizationCredits(
  organizationId: string,
  options: CreditCheckOptions = {}
): Promise<{
  hasCredits: boolean
  currentBalance: number
  estimatedCost: number
  message?: string
}> {
  try {
    // Get current credit balance
    const credits = await organizationCreditsService.getOrganizationCredits(organizationId)
    const currentBalance = credits?.credits || 0

    // If no specific requirements, just check if there are any credits
    if (!options.estimatedTokens && !options.minimumBalance) {
      return {
        hasCredits: currentBalance > 0,
        currentBalance,
        estimatedCost: 0,
        message: currentBalance <= 0 ? 'No credits available' : undefined
      }
    }

    // Calculate estimated cost if tokens provided
    let estimatedCost = 0
    if (options.estimatedTokens && options.model) {
      const systemCost = costCalculatorService.estimateMessageCost(
        options.model,
        options.estimatedTokens,
        options.estimatedTokens // Assume equal input/output for estimation
      )
      estimatedCost = userPricingService.calculateUserCost(systemCost)
    }

    // Determine required balance
    const requiredBalance = options.minimumBalance || estimatedCost

    // Check if sufficient credits
    const hasCredits = currentBalance >= requiredBalance

    return {
      hasCredits,
      currentBalance,
      estimatedCost,
      message: !hasCredits 
        ? `Insufficient credits. Required: ${userPricingService.formatCost(requiredBalance)}, Available: ${userPricingService.formatCost(currentBalance)}`
        : undefined
    }
  } catch (error) {
    // If credit check fails, log error but allow request to proceed
    // This prevents credit system issues from breaking the entire service
    console.error('Credit check failed:', error)
    return {
      hasCredits: true, // Fail open
      currentBalance: 0,
      estimatedCost: 0,
      message: 'Credit check temporarily unavailable'
    }
  }
}

/**
 * Middleware to enforce credit requirements
 */
export function withCreditCheck(options: CreditCheckOptions = {}) {
  return function creditCheckMiddleware<T extends (...args: unknown[]) => Promise<NextResponse>>(
    handler: T
  ): T {
    return (async (...args: Parameters<T>) => {
      // const request = args[0] as NextRequest // Currently unused but available if needed
      const context = args[1] as AuthContext

      // Skip credit check for admin users if configured
      if (options.bypassForAdmin && (context.user.role === 'ADMIN' || context.user.role === 'SUPER_ADMIN')) {
        return handler(...args)
      }

      // Skip if no organization ID
      if (!context.user.organizationId) {
        return Api.error('VALIDATION_ERROR', 'User is not associated with an organization')
      }

      // Perform credit check
      const creditCheck = await checkOrganizationCredits(context.user.organizationId, options)

      if (!creditCheck.hasCredits) {
        return Api.error(
          'VALIDATION_ERROR',
          options.errorMessage || creditCheck.message || 'Insufficient credits to process this request',
          {
            currentBalance: creditCheck.currentBalance,
            estimatedCost: creditCheck.estimatedCost,
            formattedBalance: userPricingService.formatCost(creditCheck.currentBalance),
            formattedCost: userPricingService.formatCost(creditCheck.estimatedCost)
          }
        )
      }

      // Credits OK, proceed with request
      return handler(...args)
    }) as T
  }
}

/**
 * Helper to estimate tokens for a message
 * This is a rough estimation - actual tokens will be calculated by OpenAI
 */
export function estimateMessageTokens(message: string): number {
  // Rough estimation: ~4 characters per token
  const baseTokens = Math.ceil(message.length / 4)
  
  // Add buffer for system prompt and response
  const buffer = 500 // Conservative buffer
  
  return baseTokens + buffer
}

/**
 * Get credit status for display in UI
 */
export async function getCreditStatus(organizationId: string): Promise<{
  hasCredits: boolean
  balance: number
  formattedBalance: string
  isLow: boolean
  isEmpty: boolean
  warning?: string
}> {
  const credits = await organizationCreditsService.getOrganizationCredits(organizationId)
  const balance = credits?.credits || 0
  
  return {
    hasCredits: balance > 0,
    balance,
    formattedBalance: userPricingService.formatCost(balance),
    isLow: balance > 0 && balance < 1.0,
    isEmpty: balance <= 0,
    warning: balance <= 0 
      ? 'No credits available. Please add credits to continue using the service.'
      : balance < 1.0 
      ? 'Credit balance is low. Consider adding more credits.'
      : undefined
  }
}