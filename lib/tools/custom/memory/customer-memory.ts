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
      const actualCustomerId = (runContext?.customerId as string) || 'anonymous-customer'
      const actualOrganizationId = (runContext?.organizationId as string) || 'default-org'
      const customerName = (runContext?.customerName as string) || 'Anonymous User'
      const customerEmail = (runContext?.customerEmail as string) || 'user@example.com'
      
      console.log('🧠 Memory tool called:', { 
        action, 
        actualCustomerId, 
        actualOrganizationId, 
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
            organizationId: actualOrganizationId,
            content,
            memoryType: memoryType || 'context',
            metadata: {
              savedAt: new Date().toISOString(),
              source: 'agent_conversation',
              customerName: customerName,
              customerEmail: customerEmail
            }
          })

          console.log('🧠 Memory successfully saved to database:', {
            customerId: actualCustomerId,
            organizationId: actualOrganizationId,
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
            organizationId: actualOrganizationId,
            limit
          })

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
            actualOrganizationId,
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