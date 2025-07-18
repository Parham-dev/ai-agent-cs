// Server-only vector service
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import type { CustomerMemory, CreateCustomerMemoryData, CustomerMemoryFilters } from '../types/database'

// Create server-only Supabase client
function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

const supabase = createServerSupabase()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class VectorService {
  /**
   * Create embedding from text using OpenAI
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      })
      return response.data[0].embedding
    } catch (error) {
      console.error('Failed to create embedding:', error)
      throw new Error('Failed to create embedding')
    }
  }

  /**
   * Save customer memory - SIMPLE VERSION
   * Just saves what the agent tells it to save
   */
  async saveCustomerMemory(data: CreateCustomerMemoryData): Promise<void> {
    try {
      const embedding = await this.createEmbedding(data.content)
      
      const { error } = await supabase
        .from('customer_memories')
        .insert({
          customer_id: data.customerId,
          organization_id: data.organizationId,
          content: data.content,
          memory_type: data.memoryType || 'context',
          embedding,
          metadata: {
            ...data.metadata,
            savedAt: new Date().toISOString(),
            source: 'agent_tool'
          }
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to save customer memory:', error)
      throw new Error('Failed to save memory')
    }
  }

  /**
   * Get customer memories - SIMPLE VERSION
   * Returns all memories for customer, most recent first
   */
  async getCustomerMemories(filters: CustomerMemoryFilters): Promise<CustomerMemory[]> {
    try {
      let query = supabase
        .from('customer_memories')
        .select('*')

      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId)
      }
      
      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId)
      }

      if (filters.memoryType) {
        query = query.eq('memory_type', filters.memoryType)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters.limit || 10)

      if (error) throw error

      return (data || []).map((item): CustomerMemory => ({
        id: item.id,
        customerId: item.customer_id,
        organizationId: item.organization_id,
        content: item.content,
        memoryType: item.memory_type as 'preference' | 'context' | 'fact',
        metadata: item.metadata || {},
        createdAt: new Date(item.created_at)
      }))
    } catch (error) {
      console.error('Failed to get customer memories:', error)
      throw new Error('Failed to retrieve memories')
    }
  }

  /**
   * Search similar memories - FOR LATER SCALING
   * Currently just returns recent memories, but ready for vector search
   */
  async searchSimilarMemories(
    customerId: string,
    organizationId: string,
    _query: string, // Prefix with underscore to indicate intentionally unused
    limit: number = 5
  ): Promise<CustomerMemory[]> {
    try {
      // For now, just return recent memories
      // TODO: Implement actual vector similarity search using _query later
      return await this.getCustomerMemories({
        customerId,
        organizationId,
        limit
      })
    } catch (error) {
      console.error('Failed to search memories:', error)
      throw new Error('Failed to search memories')
    }
  }
}

// Export singleton instance
export const vectorService = new VectorService()