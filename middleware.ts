import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Skip middleware for MCP endpoints - they handle their own auth/CORS
  if (request.nextUrl.pathname.startsWith('/api/mcp') || 
      request.nextUrl.pathname.match(/^\/api\/[^\/]+$/)) {
    return NextResponse.next();
  }

  // Handle CORS for widget API endpoints
  if (request.nextUrl.pathname.startsWith('/api/v2/widget/') || 
      request.nextUrl.pathname.startsWith('/api/v2/agents/chat')) {
    
    const origin = request.headers.get('origin');
    const response = NextResponse.next();
    
    // CORS Configuration
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // Development: Allow all origins
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
    } else {
      // Production: Strict validation
      // TODO: In production, validate origin against database
      // const agentId = extractAgentIdFromRequest(request);
      // const allowedDomains = await getAgentAllowedDomains(agentId);
      // const isAllowed = validateOrigin(origin, allowedDomains);
      
      if (origin && isValidProductionOrigin(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      } else {
        // Reject unauthorized origins in production
        return new Response('CORS Error: Origin not allowed', { status: 403 });
      }
    }
    
    // Standard CORS headers
    response.headers.set('Access-Control-Allow-Credentials', 'false');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    return response;
  }
  
  return NextResponse.next();
}

/**
 * Validate origin for production (placeholder)
 * In production, this would check against database
 */
function isValidProductionOrigin(origin: string): boolean {
  // Basic validation - reject obviously invalid origins
  if (!origin.startsWith('https://')) return false;
  if (origin.includes('localhost')) return false;
  
  // TODO: Replace with database lookup
  // return allowedDomains.includes(origin);
  return true; // Temporary for demo
}

export const config = {
  matcher: [
    '/api/v2/widget/:path*',
    '/api/v2/agents/chat'
  ]
};