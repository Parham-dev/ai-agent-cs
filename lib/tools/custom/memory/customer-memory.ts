import { tool } from '@openai/agents'
import { z } from 'zod'

export const customerMemory = tool({
  name: 'customer_memory',
  description: 'ALWAYS check customer memories first when asked about preferences, past interactions, or personal details. Use this to save new customer preferences and retrieve existing ones. Call with action="search" for questions about customer preferences.',
  parameters: z.object({
    action: z.enum(['save', 'get', 'search']).describe('Action: save=store new info, get=retrieve all memories, search=find memories by keyword (use for "how do I like to be contacted?", "what are my preferences?", etc.)'),
    content: z.string().nullable().optional().describe('Content to save (required for save action)'),
    memoryType: z.enum(['preference', 'context', 'fact']).nullable().optional().describe('Type of memory: preference (user settings), context (conversation context), fact (important facts about customer)'),
    query: z.string().nullable().optional().describe('Search query for finding memories (e.g., "contact", "preference", "email"). Required when action=search.'),
    limit: z.number().default(10).describe('Maximum number of memories to return')
  }),
  execute: async ({ action, content, memoryType, query, limit }, context) => {
    try {
      // Import server-only service dynamically
      const { vectorService } = await import('../../../services/vector.server')
      
      // Get context from agent execution environment - required for proper operation
      const runContext = context?.context as Record<string, unknown> | undefined
      
      // Required context - agent and organization
      const agentId = (runContext?.agentId as string)
      const organizationId = (runContext?.organizationId as string)
      
      if (!agentId || !organizationId) {
        return {
          success: false,
          error: 'Missing required agent or organization context'
        }
      }
      
      // Determine customer context based on chat scenario
      const platformUserId = (runContext?.platformUserId as string) || null
      const endCustomerId = (runContext?.endCustomerId as string) || null
      const chatContext = (runContext?.chatContext as string) || 'unknown'
      
      // Customer identification logic:
      let actualCustomerId: string
      let customerName: string
      let customerEmail: string
      
      if (endCustomerId) {
        // Scenario 1: End customer (widget) or Platform user acting as customer
        actualCustomerId = endCustomerId
        customerName = (runContext?.endCustomerName as string) || (runContext?.customerName as string) || 'Customer'
        customerEmail = (runContext?.endCustomerEmail as string) || (runContext?.customerEmail as string) || 'customer@example.com'
      } else if (platformUserId) {
        // Scenario 2: Platform user testing through dashboard
        actualCustomerId = `platform_user_${platformUserId}`
        customerName = (runContext?.platformUserName as string) || (runContext?.customerName as string) || 'Platform User'
        customerEmail = (runContext?.platformUserEmail as string) || (runContext?.customerEmail as string) || 'user@platform.com'
      } else {
        // Scenario 3: Fallback for anonymous/testing
        const sessionId = (runContext?.sessionId as string) || 'unknown'
        actualCustomerId = `anonymous_${sessionId}`
        customerName = 'Anonymous User'
        customerEmail = 'anonymous@example.com'
      }
      
      console.log('🧠 Memory tool called:', { 
        action, 
        actualCustomerId, 
        organizationId, 
        agentId,
        chatContext,
        platformUserId,
        endCustomerId,
        content: content?.substring(0, 50) + (content ? '...' : 'N/A'),
        memoryType,
        query,
        limit,
        customerName,
        customerEmail
      })
      
      switch (action) {
        case 'save':
          if (!content) {
            return {
              success: false,
              error: 'Content is required for save action'
            }
          }

          await vectorService.saveCustomerMemory({
            customerId: actualCustomerId,
            organizationId: organizationId,
            content,
            memoryType: memoryType || 'context',
            metadata: {
              savedAt: new Date().toISOString(),
              source: 'agent_conversation',
              agentId: agentId,
              chatContext: chatContext,
              customerName: customerName,
              customerEmail: customerEmail
            }
          })

          console.log('🧠 Memory successfully saved to database:', {
            customerId: actualCustomerId,
            organizationId: organizationId,
            agentId: agentId,
            content: content.substring(0, 100) + '...',
            memoryType: memoryType || 'context'
          })

          return {
            success: true,
            message: `Memory saved for customer ${customerName || actualCustomerId}`,
            memoryType: memoryType || 'context',
            content,
            customerId: actualCustomerId
          }

        case 'get':
          const memories = await vectorService.getCustomerMemories({
            customerId: actualCustomerId,
            limit
          }, organizationId)

          return {
            success: true,
            memories: memories.map(memory => ({
              id: memory.id,
              content: memory.content,
              type: memory.memoryType,
              createdAt: memory.createdAt.toISOString()
            })),
            count: memories.length,
            customerId: actualCustomerId,
            customerName: customerName
          }

        case 'search':
          if (!query) {
            return {
              success: false,
              error: 'Query is required for search action'
            }
          }

          const searchResults = await vectorService.searchSimilarMemories(
            actualCustomerId,
            organizationId,
            query,
            limit
          )

          const result = {
            success: true,
            query,
            memories: searchResults.map(memory => ({
              id: memory.id,
              content: memory.content,
              type: memory.memoryType,
              createdAt: memory.createdAt.toISOString()
            })),
            count: searchResults.length,
            customerId: actualCustomerId,
            customerName: customerName
          }
          
          console.log('🧠 Search results returned:', JSON.stringify(result, null, 2))
          return result

        default:
          return {
            success: false,
            error: 'Invalid action. Use save, get, or search'
          }
      }
    } catch (error) {
      console.error('🧠 Customer memory tool error:', error)
      console.error('🧠 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
      console.error('🧠 Returning error result:', JSON.stringify(errorResult, null, 2))
      return errorResult
    }
  }
})