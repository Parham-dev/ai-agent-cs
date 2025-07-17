import { PrismaClient } from '@prisma/client'
import { ORGANIZATION_CONTEXT } from '../lib/context/organization'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create organization using context
  const org = await prisma.organization.upsert({
    where: { id: ORGANIZATION_CONTEXT.id },
    update: {
      name: ORGANIZATION_CONTEXT.name,
      slug: ORGANIZATION_CONTEXT.slug,
      description: 'Main organization for the system'
    },
    create: {
      id: ORGANIZATION_CONTEXT.id,
      name: ORGANIZATION_CONTEXT.name,
      slug: ORGANIZATION_CONTEXT.slug,
      description: 'Main organization for the system'
    }
  })

  console.log('✅ Created/updated organization:', org.name, `(${org.id})`)

  // Create Shopify integration
  const shopifyIntegration = await prisma.integration.create({
    data: {
      organizationId: org.id,
      type: 'shopify',
      name: 'Main Store',
      description: 'Main Shopify integration for Demo Store',
      credentials: {
        // These would be encrypted in production
        storeDomain: 'demo-store.myshopify.com',
        accessToken: 'your-shopify-access-token'
      }
      // settings removed in V2 - sync preferences now per-agent
    }
  })

  console.log('✅ Created Shopify integration:', shopifyIntegration.name)

  // Create support agent
  const agent = await prisma.agent.create({
    data: {
      organizationId: org.id,
      name: 'Customer Support Agent',
      systemPrompt: `You are a helpful customer service agent for Demo Store. 
      You can help customers with:
      - Product information and recommendations
      - Order status and tracking
      - Return and refund policies
      - General store questions
      
      Always be friendly, professional, and helpful.`,
      model: 'gpt-4o'
    }
  })

  console.log('✅ Created agent:', agent.name, `(${agent.id})`)

  // Create a sample conversation
  const conversation = await prisma.conversation.create({
    data: {
      organizationId: org.id,
      agentId: agent.id,
      customerId: 'cust_123',
      customerEmail: 'customer@example.com',
      customerName: 'John Doe',
      messages: [
        {
          id: 'msg_1',
          senderType: 'customer',
          content: 'Hi, I\'m looking for a new laptop',
          timestamp: new Date().toISOString()
        },
        {
          id: 'msg_2', 
          senderType: 'ai',
          content: 'Hello! I\'d be happy to help you find the perfect laptop. What will you primarily be using it for?',
          timestamp: new Date().toISOString()
        }
      ],
      status: 'open',
      channel: 'web'
    }
  })

  console.log('✅ Created sample conversation:', conversation.id)

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`   Organization: ${org.name} (${org.slug})`)
  console.log(`   Integration: ${shopifyIntegration.type} - ${shopifyIntegration.name}`)
  console.log(`   Agent: ${agent.name}`)
  console.log(`   Sample conversation: ${conversation.id}`)
  
  console.log('\n🔗 Database URL used:', process.env.DATABASE_URL)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })