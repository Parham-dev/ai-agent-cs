/**
 * Agent factory for creating OpenAI Agent instances
 * Extracted from chat API to be reusable by database session store
 */

import { Agent, type MCPServerStdio } from '@openai/agents'
import { createMCPClient, type MCPClient } from '@/lib/mcp/client'
import { getAllTools } from '@/lib/tools'
import { getInputGuardrails, getOutputGuardrails } from '@/lib/guardrails'
import { logger } from '@/lib/utils/logger'
import type { AgentWithRelations } from '@/lib/types/database'

export interface AgentFactoryResult {
  agent: Agent
  mcpClient: MCPClient | null
  mcpServers: MCPServerStdio[]
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

  // Initialize MCP servers for this agent
  let mcpClient: MCPClient | null = null
  let mcpServers: MCPServerStdio[] = []
  
  if (agentIntegrations.length > 0) {
    logger.debug('Using MCP servers for integrations')
    
    try {
      // Prepare integrations for MCP client
      const mcpIntegrations = []
      
      for (const agentIntegration of agentIntegrations) {
        if (!agentIntegration.isEnabled || !agentIntegration.integration?.isActive) {
          continue
        }
        
        const integration = agentIntegration.integration
        mcpIntegrations.push({
          type: integration.type,
          name: integration.name,
          credentials: integration.credentials,
          config: agentIntegration.config || {},
          selectedTools: agentIntegration.selectedTools || []
        })
      }
      
      if (mcpIntegrations.length > 0) {
        const mcpResult = await createMCPClient(mcpIntegrations)
        mcpClient = mcpResult.client
        mcpServers = mcpResult.servers
        
        logger.info('MCP servers initialized', { 
          integrationsCount: mcpIntegrations.length,
          serversCount: mcpServers.length 
        })
      }
    } catch (error) {
      logger.error('Failed to initialize MCP servers, proceeding without integrations', {}, error as Error)
      mcpClient = null
      mcpServers = []
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
    guardrails?: { input?: string[], output?: string[] }
    [key: string]: unknown
  }

  // Configure guardrails if they exist
  const inputGuardrails = guardrailsConfig?.input ? getInputGuardrails(guardrailsConfig.input) : []
  const outputGuardrails = guardrailsConfig?.output ? getOutputGuardrails(guardrailsConfig.output) : []
  
  logger.info('Guardrails configured', {
    inputGuardrailsCount: inputGuardrails.length,
    outputGuardrailsCount: outputGuardrails.length,
    inputGuardrails: guardrailsConfig?.input || [],
    outputGuardrails: guardrailsConfig?.output || []
  })

  const openaiAgent = new Agent({
    name: agentData.name,
    instructions: agentData.systemPrompt || `You are ${agentData.name}, an AI assistant.`,
    model: agentData.model,
    mcpServers: mcpServers.length > 0 ? mcpServers : undefined,
    tools: allTools.length > 0 ? allTools : undefined,
    inputGuardrails: inputGuardrails.length > 0 ? inputGuardrails : undefined,
    outputGuardrails: outputGuardrails.length > 0 ? outputGuardrails : undefined,
    ...cleanAgentConfig
  })

  logger.info('Agent instance created successfully', {
    agentId: agentData.id,
    agentName: agentData.name,
    model: agentData.model,
    hasTools: allTools.length > 0,
    hasMCPServers: mcpServers.length > 0,
    hasGuardrails: inputGuardrails.length > 0 || outputGuardrails.length > 0
  })

  return {
    agent: openaiAgent,
    mcpClient,
    mcpServers
  }
}