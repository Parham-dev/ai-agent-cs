import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface OldAgentConfig {
  integrations?: {
    id: string
    selectedTools?: string[]
    settings?: Record<string, unknown>
  }[]
  behavior?: Record<string, unknown>
  rules?: Record<string, unknown>
  [key: string]: unknown
}

async function migrateData() {
  console.log('🔄 Starting data migration...')

  try {
    // Get all agents with their current agentConfig
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        organizationId: true,
        agentConfig: true,
        instructions: true,
        systemPrompt: true
      }
    })

    console.log(`📊 Found ${agents.length} agents to migrate`)

    for (const agent of agents) {
      console.log(`🔄 Migrating agent: ${agent.id}`)

      const config = agent.agentConfig as OldAgentConfig || {}

      // 1. Move instructions to systemPrompt if systemPrompt is empty
      const updateData: Record<string, unknown> = {}
      if (agent.instructions && !agent.systemPrompt) {
        updateData.systemPrompt = agent.instructions
      }

      // 2. Extract rules from agentConfig
      const rules = {
        ...config.behavior,
        ...config.rules
      }
      if (Object.keys(rules).length > 0) {
        updateData.rules = rules
      }

      // 3. Update agent with extracted data
      if (Object.keys(updateData).length > 0) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: updateData
        })
      }

      // 4. Create AgentIntegration records from agentConfig.integrations
      if (config.integrations && Array.isArray(config.integrations)) {
        for (const integration of config.integrations) {
          try {
            // Check if integration exists
            const existingIntegration = await prisma.integration.findUnique({
              where: { id: integration.id }
            })

            if (existingIntegration) {
              // Create AgentIntegration relationship
              await prisma.agentIntegration.upsert({
                where: {
                  agentId_integrationId: {
                    agentId: agent.id,
                    integrationId: integration.id
                  }
                },
                create: {
                  agentId: agent.id,
                  integrationId: integration.id,
                  selectedTools: integration.selectedTools || [],
                  config: integration.settings || {},
                  isEnabled: true
                },
                update: {
                  selectedTools: integration.selectedTools || [],
                  config: integration.settings || {},
                  isEnabled: true
                }
              })
              console.log(`  ✅ Created AgentIntegration: ${agent.id} → ${integration.id}`)
            } else {
              console.log(`  ⚠️  Integration ${integration.id} not found, skipping`)
            }
          } catch (error) {
            console.error(`  ❌ Failed to create AgentIntegration for ${integration.id}:`, error)
          }
        }
      }
    }

    // 5. Since we did a force-reset, there's no old data to clean up
    console.log('🧹 Database was reset, no old Integration.settings to clean up')

    console.log('✅ Data migration completed successfully!')

  } catch (error) {
    console.error('❌ Data migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('🎉 Migration script completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error)
      process.exit(1)
    })
}

export { migrateData }
