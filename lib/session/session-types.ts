/**
 * Session types for database-backed session store
 * Enhanced from original in-memory version
 */

import { Agent, type AgentInputItem } from '@openai/agents'
import { MCPClient } from '@/lib/mcp/client'

export interface SessionData {
  sessionId: string
  agentId: string
  organizationId: string        // Required for database operations
  conversationId: string        // Required - Links to conversation in database (set during session creation)
  thread: AgentInputItem[]      // Conversation history following OpenAI SDK pattern
  agent: Agent                  // Reusable agent instance  
  mcpClient: MCPClient | null   // MCP client instance
  lastActivity: Date            // For cleanup/timeout
  metadata?: Record<string, unknown> // Additional session context stored in conversation.context
}

// For initial session creation before conversation is created
export interface PendingSessionData {
  sessionId: string
  agentId: string
  organizationId: string
  conversationId?: string       // Optional during creation, but must be set before storing
  thread: AgentInputItem[]
  agent: Agent
  mcpClient: MCPClient | null
  lastActivity: Date
  metadata?: Record<string, unknown>
}

export interface SessionSummary {
  sessionId: string
  agentId: string
  organizationId: string
  conversationCount: number
  messageCount: number
  lastActivity: Date
  firstActivity: Date
  metadata?: Record<string, unknown>
}

export interface SessionStats {
  total: number
  byAgent: Record<string, number>
  byOrganization?: Record<string, number>
}