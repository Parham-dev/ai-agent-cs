-- CreateTable
CREATE TABLE "widget_configs" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "position" TEXT NOT NULL DEFAULT 'bottom-right',
    "theme" TEXT NOT NULL DEFAULT 'auto',
    "primaryColor" TEXT NOT NULL DEFAULT '#007bff',
    "greeting" TEXT,
    "placeholder" TEXT NOT NULL DEFAULT 'Type your message...',
    "showPoweredBy" BOOLEAN NOT NULL DEFAULT true,
    "allowedDomains" TEXT[] DEFAULT ARRAY['*']::TEXT[],
    "customTheme" JSONB DEFAULT '{}',
    "triggers" JSONB NOT NULL DEFAULT '{}',
    "features" TEXT[] DEFAULT ARRAY['chat', 'typing-indicator']::TEXT[],
    "customCSS" TEXT,
    "deployedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "widget_configs_agentId_key" ON "widget_configs"("agentId");

-- AddForeignKey
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
