-- Create knowledge center table
CREATE TABLE knowledge_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  organization_filter text
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_entries.id,
    knowledge_entries.title,
    knowledge_entries.content,
    knowledge_entries.metadata,
    (knowledge_entries.embedding <=> query_embedding) * -1 + 1 AS similarity
  FROM knowledge_entries
  WHERE knowledge_entries.organization_id = organization_filter
    AND (knowledge_entries.embedding <=> query_embedding) < (1 - match_threshold)
  ORDER BY knowledge_entries.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create indexes for performance
CREATE INDEX knowledge_entries_embedding_idx ON knowledge_entries 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX knowledge_entries_org_idx ON knowledge_entries(organization_id);

-- Add comments
COMMENT ON TABLE knowledge_entries IS 'Knowledge base entries with vector embeddings for semantic search';
COMMENT ON FUNCTION match_knowledge IS 'Vector similarity search for knowledge entries';