/**
 * Agent factory for creating OpenAI Agent instances
 * Simplified architecture using direct OpenAI SDK integration
 */

import { Agent, MCPServerStreamableHttp, hostedMcpTool } from '@openai/agents'
import { createMCPIntegration } from './mcp-integration'
import { getAllTools } from '@/lib/tools'
import { getInputGuardrails, getOutputGuardrails } from '@/lib/guardrails'
import { encryptionService } from '@/lib/services'
import { logger } from '@/lib/utils/logger'
import type { AgentWithRelations } from '@/lib/types/database'
import type { IntegrationCredentials, CustomMcpCredentials } from '@/lib/types/integrations'

export interface AgentFactoryResult {
  agent: Agent
  cleanup: () => Promise<void>
}

/**
 * Create OpenAI Agent instance with MCP servers and tools
 */
export async function createAgent(agentData: AgentWithRelations): Promise<AgentFactoryResult> {
  logger.debug('Creating agent instance', { 
    agentId: agentData.id, 
    agentName: agentData.name,
    isActive: agentData.isActive 
  })

  if (!agentData.isActive) {
    throw new Error('Cannot create instance for inactive agent')
  }

  // Get agent integrations
  const agentIntegrations = agentData.agentIntegrations || []
  logger.debug('Agent integration configs found', { 
    integrationsCount: agentIntegrations.length 
  })

  // Initialize MCP integration
  let mcpServers: MCPServerStreamableHttp[] = []
  let hostedTools: ReturnType<typeof hostedMcpTool>[] = []
  let mcpCleanup: (() => Promise<void>) = async () => {}
  
  if (agentIntegrations.length > 0) {
    logger.debug('Setting up MCP integration for agent')
    
    try {
      // Prepare integrations with decrypted credentials
      const mcpIntegrations = []
      
      for (const agentIntegration of agentIntegrations) {
        if (!agentIntegration.isEnabled || !agentIntegration.integration?.isActive) {
          continue
        }
        
        const integration = agentIntegration.integration
        
        // Decrypt credentials if they are encrypted
        let decryptedCredentials: IntegrationCredentials | CustomMcpCredentials = integration.credentials as IntegrationCredentials | CustomMcpCredentials
        try {
          if (encryptionService.isEncrypted(integration.credentials)) {
            decryptedCredentials = await encryptionService.decryptCredentials<IntegrationCredentials | CustomMcpCredentials>(
              integration.credentials
            )
            logger.debug('Decrypted integration credentials', { 
              integrationId: integration.id,
              integrationType: integration.type 
            })
          }
        } catch (error) {
          logger.error('Failed to decrypt integration credentials', { 
            integrationId: integration.id,
            integrationType: integration.type,
            error: error instanceof Error ? error.message : String(error)
          }, error as Error)
          // Skip this integration if credentials can't be decrypted
          continue
        }
        
        mcpIntegrations.push({
          type: integration.type,
          name: integration.name,
          credentials: decryptedCredentials,
          config: {
            ...(agentIntegration.config as Record<string, unknown>) || {},
            organizationId: integration.organizationId
          },
          selectedTools: agentIntegration.selectedTools || []
        })
      }
      
      if (mcpIntegrations.length > 0) {
        const mcpResult = await createMCPIntegration(mcpIntegrations)
        mcpServers = mcpResult.servers
        hostedTools = mcpResult.hostedTools
        mcpCleanup = mcpResult.cleanup
        
        logger.info('MCP integration initialized', { 
          integrationsCount: mcpIntegrations.length,
          serversCount: mcpServers.length,
          hostedToolsCount: hostedTools.length
        })
      }
    } catch (error) {
      logger.error('Failed to initialize MCP integration, proceeding without integrations', {}, error as Error)
      mcpServers = []
      hostedTools = []
    }
  }

  // Get selected tools from agent integrations
  const agentSelectedTools = agentIntegrations
    .filter(ai => ai.isEnabled && ai.integration?.isActive)
    .flatMap(ai => ai.selectedTools || [])

  logger.debug('Agent selected tools', { selectedTools: agentSelectedTools })

  // Get universal tools (includes memory and knowledge search)
  const { customTools, openaiTools } = getAllTools(agentSelectedTools)

  const allTools = [...customTools, ...openaiTools]
  
  logger.info('Universal tools configured', {
    customToolsCount: customTools.length,
    openaiToolsCount: openaiTools.length,
    totalToolsCount: allTools.length,
    selectedTools: agentSelectedTools
  })

  // Create the OpenAI Agent instance
  const agentConfig = agentData.rules && typeof agentData.rules === 'object' ? agentData.rules : {}
  
  // Remove tools and guardrails from agentConfig to avoid conflict
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tools: _tools, guardrails: guardrailsConfig, ...cleanAgentConfig } = agentConfig as {
    tools?: unknown
    guardrails?: { 
      input?: string[]
      output?: string[]
      customInstructions?: {
        input?: string
        output?: string
      }
    }
    [key: string]: unknown
  }

  // Configure guardrails if they exist
  const inputGuardrails = guardrailsConfig?.input ? getInputGuardrails(
    guardrailsConfig.input,
    undefined, // thresholds - not implemented yet
    guardrailsConfig.customInstructions
  ) : []
  const outputGuardrails = guardrailsConfig?.output ? getOutputGuardrails(
    guardrailsConfig.output,
    undefined, // thresholds - not implemented yet
    guardrailsConfig.customInstructions
  ) : []
  
  logger.info('Guardrails configured', {
    inputGuardrailsCount: inputGuardrails.length,
    outputGuardrailsCount: outputGuardrails.length,
    inputGuardrails: guardrailsConfig?.input || [],
    outputGuardrails: guardrailsConfig?.output || []
  })

  // Combine regular tools with hosted MCP tools
  const combinedTools = [
    ...allTools,
    ...hostedTools
  ]

  const openaiAgent = new Agent({
    name: agentData.name,
    instructions: agentData.systemPrompt || `You are ${agentData.name}, an AI assistant.`,
    model: agentData.model,
    mcpServers: mcpServers.length > 0 ? mcpServers : undefined,
    tools: combinedTools.length > 0 ? combinedTools : undefined,
    inputGuardrails: inputGuardrails.length > 0 ? inputGuardrails : undefined,
    outputGuardrails: outputGuardrails.length > 0 ? outputGuardrails : undefined,
    ...cleanAgentConfig
  })

  logger.info('Agent instance created successfully', {
    agentId: agentData.id,
    agentName: agentData.name,
    model: agentData.model,
    regularToolsCount: allTools.length,
    hostedToolsCount: hostedTools.length,
    totalToolsCount: combinedTools.length,
    mcpServersCount: mcpServers.length,
    hasGuardrails: inputGuardrails.length > 0 || outputGuardrails.length > 0
  })

  // Return agent with cleanup function
  return {
    agent: openaiAgent,
    cleanup: mcpCleanup
  }
}