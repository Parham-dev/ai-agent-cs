-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "organizationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "customer_memories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "memory_type" TEXT NOT NULL DEFAULT 'context',
    "embedding" vector(1536),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "embedding" vector(1536),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "knowledge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "customer_memories_customer_id_organization_id_idx" ON "customer_memories"("customer_id", "organization_id");

-- CreateIndex
CREATE INDEX "customer_memories_created_at_idx" ON "customer_memories"("created_at" DESC);

-- CreateIndex
CREATE INDEX "knowledge_entries_organization_id_idx" ON "knowledge_entries"("organization_id");

-- Vector indexes (using ivfflat for cosine similarity)
CREATE INDEX customer_memories_embedding_idx ON customer_memories 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX knowledge_entries_embedding_idx ON knowledge_entries 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_memories" ADD CONSTRAINT "customer_memories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comments for documentation
COMMENT ON TABLE "customer_memories" IS 'Customer conversation memories and preferences with vector embeddings';
COMMENT ON COLUMN "customer_memories"."memory_type" IS 'Type: preference (user settings), context (conversation context), fact (important facts about customer)';
COMMENT ON COLUMN "customer_memories"."metadata" IS 'Additional metadata like source, importance, tags, etc.';

COMMENT ON TABLE "knowledge_entries" IS 'Knowledge base entries with vector embeddings for semantic search';
COMMENT ON COLUMN "knowledge_entries"."category" IS 'Category for organizing knowledge entries (e.g., FAQ, Policy, Procedure)';
COMMENT ON COLUMN "knowledge_entries"."tags" IS 'Tags for filtering and categorization';