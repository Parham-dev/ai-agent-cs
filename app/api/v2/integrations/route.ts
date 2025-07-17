import { NextRequest, NextResponse } from 'next/server'
import { integrationsService } from '@/lib/database/services'
import { Api, withErrorHandling, validateMethod, ErrorCodes } from '@/lib/api'

export const GET = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { searchParams } = new URL(request.url)
  
  const filters = {
    organizationId: searchParams.get('organizationId') || undefined,
    type: searchParams.get('type') || undefined,
    search: searchParams.get('search') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
  }

  const integrations = await integrationsService.getIntegrations(filters)
  
  return Api.success(integrations)
});

export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  const data = await request.json()
  
  // Validation for required fields
  const validationErrors: Record<string, string> = {};
  
  if (!data.organizationId) {
    validationErrors.organizationId = 'Organization ID is required';
  }
  
  if (!data.type?.trim()) {
    validationErrors.type = 'Integration type is required';
  }
  
  if (!data.name?.trim()) {
    validationErrors.name = 'Integration name is required';
  }

  if (!data.credentials || typeof data.credentials !== 'object') {
    validationErrors.credentials = 'Integration credentials are required';
  }
  
  if (Object.keys(validationErrors).length > 0) {
    return Api.error(ErrorCodes.VALIDATION_ERROR, 'Validation failed', { errors: validationErrors });
  }

  const integration = await integrationsService.createIntegration({
    organizationId: data.organizationId,
    type: data.type.trim(),
    name: data.name.trim(),
    description: data.description?.trim() || null,
    credentials: data.credentials,
  })
  
  return Api.success({ integration }, undefined, 201)
});
