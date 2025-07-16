import { NextRequest, NextResponse } from 'next/server'
import { integrationsServiceV2 } from '@/lib/database/services/v2/integrations.service'
import { Api, withErrorHandling, validateMethod, ErrorCodes } from '@/lib/api'

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { id } = await params;
  const integration = await integrationsServiceV2.getIntegrationById(id)
  
  if (!integration) {
    return Api.error(ErrorCodes.NOT_FOUND, 'Integration not found');
  }
  
  return Api.success({ integration })
});

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['PUT']);
  if (methodError) return methodError;

  const { id } = await params;
  const data = await request.json()
  
  // Validation for fields that can be updated
  const validationErrors: Record<string, string> = {};
  
  if (data.name !== undefined && !data.name?.trim()) {
    validationErrors.name = 'Integration name cannot be empty';
  }

  if (data.credentials !== undefined && (!data.credentials || typeof data.credentials !== 'object')) {
    validationErrors.credentials = 'Integration credentials must be a valid object';
  }
  
  if (Object.keys(validationErrors).length > 0) {
    return Api.error(ErrorCodes.VALIDATION_ERROR, 'Validation failed', { errors: validationErrors });
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.credentials !== undefined) updateData.credentials = data.credentials;

  const integration = await integrationsServiceV2.updateIntegration(id, updateData)
  
  return Api.success({ integration })
});

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['DELETE']);
  if (methodError) return methodError;

  const { id } = await params;
  await integrationsServiceV2.deleteIntegration(id)
  
  return Api.success({ message: 'Integration deleted successfully' })
});
