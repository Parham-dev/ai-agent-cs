import { NextRequest, NextResponse } from 'next/server';
import { agentsService } from '@/lib/database/services/agents.service';
import { Api, withErrorHandling, validateMethod } from '@/lib/api';
import { createApiLogger } from '@/lib/utils/logger';
import { sign } from 'jsonwebtoken';

interface WidgetAuthRequest {
  agentId: string;
  domain: string;
  referrer?: string;
  userAgent?: string;
  url?: string;
}

interface WidgetAuthResponse {
  sessionToken: string;
  agent: {
    id: string;
    name: string;
    greeting?: string;
    isActive: boolean;
  };
  config: {
    allowedDomains?: string[];
    features: string[];
    branding?: Record<string, unknown>;
  };
}

/**
 * Widget Authentication Endpoint
 * 
 * Authenticates widget requests and provides session tokens for chat API access.
 * Validates domain permissions and returns agent configuration.
 */
export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  // Validate HTTP method
  const methodError = validateMethod(request, ['POST']);
  if (methodError) return methodError;

  const logger = createApiLogger({
    endpoint: '/api/widget/auth',
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || 'unknown',
  });

  try {
    const { agentId, domain, referrer, url }: WidgetAuthRequest = await request.json();

    logger.info('Widget authentication request', {
      agentId,
      domain,
      referrer,
      url: url?.substring(0, 100) // Truncate URL for logging
    });

    // Validate required fields
    if (!agentId || !domain) {
      logger.warn('Widget auth validation failed', {
        hasAgentId: !!agentId,
        hasDomain: !!domain
      });
      return Api.validationError({
        agentId: !agentId ? 'Agent ID is required' : undefined,
        domain: !domain ? 'Domain is required' : undefined
      });
    }

    // Get agent with its integrations
    const agent = await agentsService.getAgentWithIntegrations(agentId);
    
    if (!agent) {
      logger.warn('Widget auth: agent not found', { agentId });
      return Api.notFound('Agent', agentId);
    }

    logger.debug('Agent found for widget auth', {
      agentId: agent.id,
      name: agent.name,
      isActive: agent.isActive,
      integrationsCount: agent.integrations.length
    });

    // Check if agent is active
    if (!agent.isActive) {
      logger.warn('Widget auth: agent not active', { agentId });
      return Api.error('VALIDATION_ERROR', 'Agent is not active');
    }

    // Domain validation (for now, allow all domains - in production you'd validate against allowed domains)
    // TODO: Implement domain allowlist validation from agent/organization settings
    const isValidDomain = validateDomain(domain, agent.organizationId);
    if (!isValidDomain) {
      logger.warn('Widget auth: domain not allowed', { domain, agentId });
      return Api.error('VALIDATION_ERROR', 'Domain not authorized for this agent');
    }

    // Generate session token
    const sessionToken = generateSessionToken({
      agentId: agent.id,
      organizationId: agent.organizationId,
      domain: domain,
      timestamp: Date.now()
    });

    // Prepare response
    const response: WidgetAuthResponse = {
      sessionToken,
      agent: {
        id: agent.id,
        name: agent.name,
        greeting: extractGreeting(agent.instructions),
        isActive: agent.isActive
      },
      config: {
        allowedDomains: ['*'], // TODO: Get from agent/org settings
        features: ['chat', 'typing-indicator'], // Base features
        branding: {
          // TODO: Get branding from agent/org settings
          primaryColor: '#007bff',
          theme: 'auto'
        }
      }
    };

    // Add integration-specific features
    if (agent.integrations.length > 0) {
      const activeIntegrations = agent.integrations.filter(i => i.isActive);
      response.config.features.push('integrations');
      
      // Add integration types to features
      activeIntegrations.forEach(integration => {
        response.config.features.push(`integration-${integration.type}`);
      });
    }

    logger.info('Widget authentication successful', {
      agentId,
      domain,
      featuresCount: response.config.features.length,
      sessionTokenGenerated: true
    });

    return Api.success(response);

  } catch (error) {
    logger.error('Widget authentication failed', {}, error as Error);
    
    return Api.error(
      'INTERNAL_ERROR',
      'Failed to authenticate widget request',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

/**
 * Validate if domain is allowed for the agent
 * TODO: Implement proper domain validation against agent/organization settings
 */
function validateDomain(domain: string, _organizationId: string): boolean {
  // For now, allow all domains for development
  // In production, you would check against a whitelist stored in the database
  
  // Basic validation - reject obviously invalid domains
  if (!domain || domain.length < 3) {
    return false;
  }
  
  // Reject localhost for production (allow for development)
  if (process.env.NODE_ENV === 'production' && 
      (domain === 'localhost' || domain.startsWith('127.0.0.') || domain.startsWith('192.168.'))) {
    return false;
  }
  
  // TODO: Check against organization's allowed domains
  // const allowedDomains = await getOrganizationAllowedDomains(organizationId);
  // return allowedDomains.includes(domain) || allowedDomains.includes('*');
  
  return true;
}

/**
 * Generate a signed JWT session token for widget authentication
 */
function generateSessionToken(payload: {
  agentId: string;
  organizationId: string;
  domain: string;
  timestamp: number;
}): string {
  const secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  
  const tokenPayload = {
    ...payload,
    type: 'widget-session',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  };
  
  return sign(tokenPayload, secretKey);
}

/**
 * Extract greeting message from agent instructions
 */
function extractGreeting(instructions: string): string | undefined {
  // Look for common greeting patterns in instructions
  const greetingPatterns = [
    /greeting[:\s]+["']([^"']+)["']/i,
    /welcome[:\s]+["']([^"']+)["']/i,
    /say[:\s]+["']([^"']+)["']/i
  ];
  
  for (const pattern of greetingPatterns) {
    const match = instructions.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Default greeting based on agent purpose
  if (instructions.toLowerCase().includes('customer service') || 
      instructions.toLowerCase().includes('support')) {
    return "Hello! How can I help you today?";
  }
  
  if (instructions.toLowerCase().includes('sales') || 
      instructions.toLowerCase().includes('selling')) {
    return "Hi there! Looking for something specific?";
  }
  
  return undefined; // Let widget use default
}