import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ApiResponseHelper as Api, validateMethod } from '@/lib/api/helpers';
import { DEFAULT_AI_MODEL } from '@/lib/constants';
import type { AuthContext } from '@/lib/types';

/**
 * Get organization settings/preferences for agent creation
 * Returns default values and preferences for the current user's organization
 */
export const GET = withAuth(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  // For now, return sensible defaults
  // In the future, this could come from a database table
  const organizationSettings = {
    // Default model preferences
    defaultModel: DEFAULT_AI_MODEL,
    defaultTemperature: 0.7,
    defaultMaxTokens: 4000,
    
    // Default agent settings
    defaultInstructions: "You are a helpful AI assistant. Always be polite, accurate, and helpful.",
    
    // Organization limits/constraints
    allowedModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'], // Could be org-specific
    maxTokenLimit: 16000,
    temperatureRange: { min: 0, max: 2 },
    
    // UI preferences
    showAdvancedOptions: true,
    enableCustomInstructions: true,
    defaultOutputType: 'text' as const,
    defaultToolChoice: 'auto' as const,
    
    // Organization metadata
    organizationId: context.user.organizationId,
    organizationName: 'Your Organization' // TODO: Fetch from organization table when needed
  };

  return Api.success(organizationSettings);
});