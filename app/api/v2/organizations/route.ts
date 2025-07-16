import { NextRequest, NextResponse } from 'next/server'
import { organizationsService } from '@/lib/database/services/organizations.service'
import { Api, withErrorHandling, validateMethod, ErrorCodes } from '@/lib/api'

export const GET = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { searchParams } = new URL(request.url)
  
  const filters = {
    search: searchParams.get('search') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
  }

  const organizations = await organizationsService.getOrganizations(filters)
  
  return Api.success({ organizations })
});

export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  const data = await request.json()
  
  // Validation for required fields
  const validationErrors: Record<string, string> = {};
  
  if (!data.name?.trim()) {
    validationErrors.name = 'Organization name is required';
  }
  
  if (Object.keys(validationErrors).length > 0) {
    return Api.error(ErrorCodes.VALIDATION_ERROR, 'Validation failed', { errors: validationErrors });
  }

  const organization = await organizationsService.createOrganization({
    name: data.name.trim(),
    slug: data.slug?.trim() || data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    description: data.description?.trim() || null,
  })
  
  return Api.success({ organization }, undefined, 201)
});
