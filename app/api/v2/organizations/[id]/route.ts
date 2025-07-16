import { NextRequest, NextResponse } from 'next/server'
import { organizationsService } from '@/lib/database/services/organizations.service'
import { Api, withErrorHandling, validateMethod, ErrorCodes } from '@/lib/api'

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { id } = await params;
  const organization = await organizationsService.getOrganizationById(id)
  
  if (!organization) {
    return Api.error(ErrorCodes.NOT_FOUND, 'Organization not found');
  }
  
  return Api.success({ organization })
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
    validationErrors.name = 'Organization name cannot be empty';
  }

  if (data.slug !== undefined && !data.slug?.trim()) {
    validationErrors.slug = 'Organization slug cannot be empty';
  }
  
  if (Object.keys(validationErrors).length > 0) {
    return Api.error(ErrorCodes.VALIDATION_ERROR, 'Validation failed', { errors: validationErrors });
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.slug !== undefined) updateData.slug = data.slug.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;

  const organization = await organizationsService.updateOrganization(id, updateData)
  
  return Api.success({ organization })
});

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['DELETE']);
  if (methodError) return methodError;

  const { id } = await params;
  await organizationsService.deleteOrganization(id)
  
  return Api.success({ message: 'Organization deleted successfully' })
});
