/*
  Warnings:

  - You are about to drop the column `agentConfig` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `instructions` on the `agents` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `integrations` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `organizations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organizationId,type]` on the table `integrations` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "customer_memories_embedding_idx";

-- DropIndex
DROP INDEX "integrations_organizationId_type_name_key";

-- DropIndex
DROP INDEX "knowledge_entries_embedding_idx";

-- AlterTable
ALTER TABLE "agents" DROP COLUMN "agentConfig",
DROP COLUMN "instructions",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "maxTokens" INTEGER NOT NULL DEFAULT 4000,
ADD COLUMN     "rules" JSONB DEFAULT '{}',
ADD COLUMN     "systemPrompt" TEXT,
ADD COLUMN     "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7;

-- AlterTable
ALTER TABLE "integrations" DROP COLUMN "settings",
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "isActive",
DROP COLUMN "settings",
ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "agent_integrations" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "selectedTools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "config" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_integrations_agentId_integrationId_key" ON "agent_integrations"("agentId", "integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_organizationId_type_key" ON "integrations"("organizationId", "type");

-- AddForeignKey
ALTER TABLE "agent_integrations" ADD CONSTRAINT "agent_integrations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_integrations" ADD CONSTRAINT "agent_integrations_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
