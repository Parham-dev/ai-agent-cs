-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "agentConfig" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "integrations" ADD COLUMN     "agentId" TEXT;

-- AddForeignKey
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
