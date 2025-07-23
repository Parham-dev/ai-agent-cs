-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT_PURCHASE', 'USAGE_DEDUCTION', 'FREE_CREDIT', 'REFUND');

-- AlterTable
ALTER TABLE "usage_records" ADD COLUMN "userCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "organization_credits" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeCredits" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "paidCredits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_credits_organizationId_key" ON "organization_credits"("organizationId");

-- CreateIndex
CREATE INDEX "credit_transactions_organizationId_createdAt_idx" ON "credit_transactions"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "organization_credits" ADD CONSTRAINT "organization_credits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;