import { NextRequest, NextResponse } from 'next/server';
import { agentsService } from '@/lib/database/services'
import { withAuth, withRoles } from '@/lib/auth/middleware';
import { withRateLimit, RateLimits } from '@/lib/auth/rate-limiting';
import { ApiResponseHelper as Api, validateMethod } from '@/lib/api/helpers';
import type { CreateAgentData, AgentFilters, AuthContext } from '@/lib/types'

// List agents - authenticated, rate-limited
export const GET = withAuth(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const url = new URL(request.url);
  const filters: Omit<AgentFilters, 'organizationId'> = {
    search: url.searchParams.get('search') || undefined,
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

  const agents = await agentsService.getAgents(filters, organizationId);
  return Api.success(agents);
});

// Create agent - admin+ only, auto org scoping
const createAgentHandler = withRoles(['ADMIN', 'SUPER_ADMIN'], async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  const data = await request.json() as Omit<CreateAgentData, 'organizationId'>;
  
  // Get organizationId from auth context (SaaS best practice)
  const organizationId = context.user.organizationId!;

  const agent = await agentsService.createAgent(data, organizationId);
  return Api.success(agent, undefined, 201);
});

export const POST = withRateLimit(RateLimits.api)(createAgentHandler);
