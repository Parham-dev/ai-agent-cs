/**
 * Session types for database-backed session store
 * Enhanced from original in-memory version
 */

import { Agent, type AgentInputItem } from '@openai/agents'
import { MCPClient } from '@/lib/mcp/client'

export interface SessionData {
  sessionId: string
  agentId: string
  organizationId: string        // NEW: Required for database operations
  conversationId?: string       // NEW: Links to conversation in database
  thread: AgentInputItem[]      // Conversation history following OpenAI SDK pattern
  agent: Agent                  // Reusable agent instance  
  mcpClient: MCPClient | null   // MCP client instance
  lastActivity: Date            // For cleanup/timeout
  metadata?: Record<string, unknown> // Additional session context stored in conversation.context
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