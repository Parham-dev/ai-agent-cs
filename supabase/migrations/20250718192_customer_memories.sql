-- Simple customer memory table
CREATE TABLE customer_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'context', -- 'preference', 'context', 'fact'
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic indexes for performance
CREATE INDEX customer_memories_customer_org_idx ON customer_memories(customer_id, organization_id);
CREATE INDEX customer_memories_created_at_idx ON customer_memories(created_at DESC);

-- Vector index (will be useful later for similarity search)
CREATE INDEX customer_memories_embedding_idx ON customer_memories 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Comments for future reference
COMMENT ON TABLE customer_memories IS 'Customer conversation memories and preferences with vector embeddings';
COMMENT ON COLUMN customer_memories.memory_type IS 'Type: preference (user settings), context (conversation context), fact (important facts about customer)';
COMMENT ON COLUMN customer_memories.metadata IS 'Additional metadata like source, importance, tags, etc.';