/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,type,name]` on the table `integrations` will be added. If there are existing duplicate values, this will fail.
  - The existing unique constraint `integrations_organizationId_type_key` on the `integrations` table will be dropped.

*/
-- DropIndex (if exists)
DROP INDEX IF EXISTS "integrations_organizationId_type_key";

-- CreateIndex
CREATE UNIQUE INDEX "integrations_organizationId_type_name_key" ON "integrations"("organizationId", "type", "name");