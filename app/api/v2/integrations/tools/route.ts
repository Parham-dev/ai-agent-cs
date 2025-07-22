import { NextRequest, NextResponse } from 'next/server'
import { ApiResponseHelper as Api, validateMethod } from '@/lib/api/helpers'
import { createApiLogger } from '@/lib/utils/logger'
import { prisma } from '@/lib/database'
import { withAuth } from '@/lib/auth/middleware'
import type { AuthContext } from '@/lib/types'

// Import available tools for each integration type
import { ALL_TOOLS as SHOPIFY_TOOLS } from '@/lib/mcp/servers/shopify/tools/index'

export const GET = withAuth(async (request: NextRequest, context: AuthContext): Promise<NextResponse> => {
  const methodError = validateMethod(request, ['GET']);
  if (methodError) return methodError;

  const { searchParams } = new URL(request.url)
  const integrationType = searchParams.get('type')
  
  const logger = createApiLogger({
    endpoint: '/api/v2/integrations/tools',
    requestId: crypto.randomUUID(),
    userAgent: request.headers.get('user-agent') || 'unknown'
  });

  if (!integrationType) {
    return Api.error('VALIDATION_ERROR', 'Integration type is required', { errors: { type: 'Integration type is required' } });
  }

  // Get organization ID from auth context
  const organizationId = context.user.organizationId!;

  logger.debug('Fetching tools for integration type', { integrationType });

  let tools: Array<{ name: string; displayName?: string; description: string }> = [];

  switch (integrationType) {
    case 'shopify':
      tools = SHOPIFY_TOOLS.map(tool => ({
        name: tool.name, // Store actual function name, not display name
        displayName: tool.name.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()), // Convert camelCase to Title Case for UI
        description: tool.description || 'No description available'
      }));
      break;
    
    case 'stripe':
      // TODO: Add Stripe tools when implemented
      tools = [];
      break;
      
    case 'custom-mcp':
      // Check if we have any saved custom-mcp integrations with discovered tools
      const customMcpIntegrations = await prisma.integration.findMany({
        where: {
          organizationId,
          type: 'custom-mcp',
          isActive: true
        }
      });
      
      // Collect discovered tools from all custom-mcp integrations
      const discoveredToolsSet = new Set<string>();
      
      console.log('🔧 Found custom-mcp integrations:', customMcpIntegrations.length);
      
      customMcpIntegrations.forEach((integration, index) => {
        const credentials = integration.credentials as Record<string, unknown>;
        console.log(`🔧 Integration ${index + 1}:`, {
          id: integration.id,
          name: integration.name,
          hasDiscoveredTools: !!credentials._discoveredTools,
          discoveredTools: credentials._discoveredTools,
          discoveredAt: credentials._discoveredAt
        });
        
        if (credentials._discoveredTools && Array.isArray(credentials._discoveredTools)) {
          credentials._discoveredTools.forEach((tool: unknown) => {
            if (typeof tool === 'string') {
              discoveredToolsSet.add(tool);
            }
          });
        }
      });
      
      const discoveredToolsArray = Array.from(discoveredToolsSet);
      
      if (discoveredToolsArray.length > 0) {
        // Return discovered tools as selectable options
        tools = discoveredToolsArray.map(toolName => ({
          name: toolName,
          displayName: toolName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `MCP Tool: ${toolName}`
        }));
        console.log('🔧 Returning discovered custom MCP tools:', discoveredToolsArray);
      } else {
        // Fallback to placeholder
        tools = [{
          name: 'dynamic-tools',
          displayName: 'Dynamic MCP Tools',
          description: 'Tools will be discovered automatically when the MCP server connects'
        }];
      }
      break;
      
    default:
      logger.warn('Unknown integration type requested', { integrationType });
      return Api.error('VALIDATION_ERROR', 'Unknown integration type', { type: integrationType });
  }

  logger.debug('Tools fetched successfully', { integrationType, toolCount: tools.length });

  return Api.success(tools);
});
