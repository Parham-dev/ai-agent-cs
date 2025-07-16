/**
 * CORS validation for widget requests
 * In production, this would check against database-stored allowed domains
 */

interface CorsConfig {
  allowedOrigins: string[];
  allowCredentials: boolean;
  maxAge: number;
}

/**
 * Get CORS configuration for an organization
 * In production, this would query the database
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getCorsConfigForOrganization(_organizationId: string): Promise<CorsConfig> {
  // TODO: Replace with database query based on organizationId
  // const org = await prisma.organization.findUnique({
  //   where: { id: organizationId },
  //   include: { allowedDomains: true }
  // });
  
  // For now, return permissive config for development
  return {
    allowedOrigins: ['*'], // In production: ['https://shop.example.com', 'https://*.example.com']
    allowCredentials: false, // Widget doesn't need cookies
    maxAge: 86400 // 24 hours
  };
}

/**
 * Validate if origin is allowed for widget requests
 */
export function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return true; // Same-origin requests
  
  if (allowedOrigins.includes('*')) return true; // Allow all (development only)
  
  return allowedOrigins.some(allowed => {
    if (allowed === origin) return true; // Exact match
    
    // Wildcard subdomain matching
    if (allowed.startsWith('*.')) {
      const baseDomain = allowed.slice(2);
      return origin.endsWith(baseDomain);
    }
    
    return false;
  });
}

/**
 * Security levels for different environments
 */
export const CORS_SECURITY_LEVELS = {
  development: {
    allowedOrigins: ['*'],
    allowCredentials: false,
    validateDomains: false
  },
  staging: {
    allowedOrigins: ['https://*.staging.example.com'],
    allowCredentials: false, 
    validateDomains: true
  },
  production: {
    allowedOrigins: [], // Must be configured per organization
    allowCredentials: false,
    validateDomains: true,
    requireHttps: true
  }
} as const;