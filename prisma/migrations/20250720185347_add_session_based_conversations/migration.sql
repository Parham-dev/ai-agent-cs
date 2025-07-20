/*
  Warnings:

  - You are about to drop the column `messages` on the `conversations` table. All the data in the column will be lost.
  - The `status` column on the `conversations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `sessionId` to the `conversations` table without a default value. This is not possible if the table is not empty.
  - Made the column `agentId` on table `conversations` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_agentId_fkey";

-- DropIndex
DROP INDEX "conversations_organizationId_status_idx";

-- DropIndex
DROP INDEX "customer_memories_embedding_idx";

-- DropIndex
DROP INDEX "knowledge_entries_embedding_idx";

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "messages",
ADD COLUMN     "context" JSONB DEFAULT '{}',
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3),
ADD COLUMN     "sessionId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "agentId" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "finishReason" TEXT,
    "toolCalls" JSONB DEFAULT '[]',
    "toolResults" JSONB DEFAULT '[]',
    "usageRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "agentId" TEXT,
    "model" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "inputCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outputCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "requestId" TEXT,
    "conversationId" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "monthlyBudget" DOUBLE PRECISION,
    "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "preferredModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "autoOptimize" BOOLEAN NOT NULL DEFAULT false,
    "maxCostPerMessage" DOUBLE PRECISION,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "alertEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "usage_records_organizationId_createdAt_idx" ON "usage_records"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "usage_records_organizationId_model_idx" ON "usage_records"("organizationId", "model");

-- CreateIndex
CREATE INDEX "usage_records_organizationId_source_idx" ON "usage_records"("organizationId", "source");

-- CreateIndex
CREATE INDEX "usage_records_agentId_createdAt_idx" ON "usage_records"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "usage_records_conversationId_idx" ON "usage_records"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_configs_organizationId_key" ON "billing_configs"("organizationId");

-- CreateIndex
CREATE INDEX "conversations_organizationId_sessionId_idx" ON "conversations"("organizationId", "sessionId");

-- CreateIndex
CREATE INDEX "conversations_organizationId_agentId_lastMessageAt_idx" ON "conversations"("organizationId", "agentId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "conversations_organizationId_customerId_idx" ON "conversations"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "conversations_sessionId_createdAt_idx" ON "conversations"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_usageRecordId_fkey" FOREIGN KEY ("usageRecordId") REFERENCES "usage_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_configs" ADD CONSTRAINT "billing_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
