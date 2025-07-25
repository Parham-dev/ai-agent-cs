import { logger } from '@/lib/utils/logger';

/**
 * Tool Filtering System for MCP Servers
 * Ensures agents only have access to selected tools
 */

export interface ToolFilterConfig {
  /**
   * Map of integration type to selected tool names
   * e.g., { 'shopify': ['searchProducts', 'getProductDetails'] }
   */
  selectedToolsByIntegration: Record<string, string[]>;
}

/**
 * Filter tools based on selected tools configuration
 */
export function filterTools<T extends { name: string }>(
  allTools: T[],
  selectedToolNames: string[]
): T[] {
  if (!selectedToolNames || selectedToolNames.length === 0) {
    logger.warn('No selected tools specified, returning empty array');
    return [];
  }

  const filteredTools = allTools.filter(tool => 
    selectedToolNames.includes(tool.name)
  );

  logger.info('Filtered tools', {
    allToolsCount: allTools.length,
    selectedCount: selectedToolNames.length,
    filteredCount: filteredTools.length,
    selectedNames: selectedToolNames,
    missingTools: selectedToolNames.filter(name => 
      !allTools.some(tool => tool.name === name)
    )
  });

  return filteredTools;
}

/**
 * Create tool filter configuration from agent integrations
 */
export function createToolFilterConfig(
  agentIntegrations: Array<{
    integration: { type: string };
    selectedTools?: string[];
    isEnabled: boolean;
  }>
): ToolFilterConfig {
  const selectedToolsByIntegration: Record<string, string[]> = {};

  for (const agentIntegration of agentIntegrations) {
    if (!agentIntegration.isEnabled) continue;

    const integrationType = agentIntegration.integration.type;
    const selectedTools = agentIntegration.selectedTools || [];

    if (selectedTools.length > 0) {
      selectedToolsByIntegration[integrationType] = selectedTools;
    }
  }

  logger.debug('Created tool filter config', {
    integrationCount: Object.keys(selectedToolsByIntegration).length,
    config: selectedToolsByIntegration
  });

  return { selectedToolsByIntegration };
}

/**
 * Get selected tools for a specific integration
 */
export function getSelectedToolsForIntegration(
  config: ToolFilterConfig,
  integrationType: string
): string[] {
  return config.selectedToolsByIntegration[integrationType] || [];
}

/**
 * Validate that all selected tools exist in the available tools
 */
export function validateSelectedTools(
  availableTools: Array<{ name: string }>,
  selectedToolNames: string[]
): {
  valid: string[];
  invalid: string[];
} {
  const availableNames = new Set(availableTools.map(t => t.name));
  
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const toolName of selectedToolNames) {
    if (availableNames.has(toolName)) {
      valid.push(toolName);
    } else {
      invalid.push(toolName);
    }
  }

  if (invalid.length > 0) {
    logger.warn('Invalid tool selections detected', {
      invalid,
      available: Array.from(availableNames)
    });
  }

  return { valid, invalid };
}