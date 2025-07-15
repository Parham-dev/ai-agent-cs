import { NextRequest, NextResponse } from 'next/server';
import { validateShopifyCredentials } from '@/lib/integrations/shopify/validator';
import { ShopifyCredentials } from '@/lib/integrations/shopify/types';

export async function POST(request: NextRequest) {
  try {
    const credentials: ShopifyCredentials = await request.json();
    
    const result = await validateShopifyCredentials(credentials);
    
    if (result.isValid) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
    
  } catch (error) {
    console.error('Validation API error:', error);
    
    return NextResponse.json({
      isValid: false,
      message: 'Invalid request format. Please check your input and try again.'
    }, { status: 500 });
  }
} 