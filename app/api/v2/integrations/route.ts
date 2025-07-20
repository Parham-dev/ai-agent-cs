import { NextRequest, NextResponse } from 'next/server';
import { integrationsService } from '@/lib/database/services'
import { withAuth } from '@/lib/auth/middleware';
import { withRateLimit, RateLimits } from '@/lib/auth/rate-limiting';
import { ApiResponseHelper as Api, validateMethod } from '@/lib/api/helpers';
import type { CreateIntegrationData, IntegrationFilters, AuthContext } from '@/lib/types'

// List integrations - authenticated, rate-limited
export const GET = withAuth(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const url = new URL(request.url);
  const filters: Omit<IntegrationFilters, 'organizationId'> = {
    search: url.searchParams.get('search') || undefined,
    type: url.searchParams.get('type') || undefined,
    isActive: url.searchParams.get('isActive') ? url.searchParams.get('isActive') === 'true' : undefined,
    limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
  };

  // Determine organizationId based on user role
  let organizationId: string;
  if (context.user.role === 'SUPER_ADMIN' && url.searchParams.get('organizationId')) {
    // Super admins can filter by any organization
    organizationId = url.searchParams.get('organizationId')!;
  } else {
    // Regular users are automatically scoped to their organization
    organizationId = context.user.organizationId!;
  }

  const integrations = await integrationsService.getIntegrations(filters, organizationId);
  return Api.success(integrations);
});

// Create integration - authenticated, rate-limited  
export const POST = withRateLimit(RateLimits.api)(
  withAuth(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
    const methodError = validateMethod(request, ['POST']);
    if (methodError) return methodError;

    const data = await request.json() as Omit<CreateIntegrationData, 'organizationId'>;
    
    // Get organizationId from auth context (SaaS best practice)
    const organizationId = context.user.organizationId!;

    const integration = await integrationsService.createIntegration(data, organizationId);
    return Api.success(integration, undefined, 201);
  })
);
