import { NextRequest, NextResponse } from 'next/server';
import { validateShopifyCredentials } from '@/lib/integrations/shopify/validator';
import { ShopifyCredentials } from '@/lib/integrations/shopify/types';
import { Api, withErrorHandling, validateMethod } from '@/lib/api';

export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  const credentials: ShopifyCredentials = await request.json();
  
  const result = await validateShopifyCredentials(credentials);
  
  if (result.isValid) {
    return Api.success(result);
  } else {
    return Api.success(result, undefined, 400);
  }
}); 