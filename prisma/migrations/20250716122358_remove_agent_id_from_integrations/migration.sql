/*
  Warnings:

  - You are about to drop the column `agentId` on the `integrations` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "integrations" DROP CONSTRAINT "integrations_agentId_fkey";

-- AlterTable
ALTER TABLE "integrations" DROP COLUMN "agentId";
