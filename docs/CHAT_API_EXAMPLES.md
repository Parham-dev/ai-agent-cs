/**
 * Example: How to use the new Chat API with Database-backed Agents
 * 
 * This example shows the improved approach where agents are stored in the database
 * with their integrations, and the chat API loads the agent configuration from the database.
 */

// Example 1: Basic chat request
async function sendChatMessage() {
  const response = await fetch('/api/agents/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId: 'agent-123', // Agent ID from database
      message: 'I need help with my order status',
      conversationHistory: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi! How can I help you today?' }
      ],
      context: {
        customerId: 'customer-456',
        sessionId: 'session-789'
      }
    })
  });

  const result = await response.json();
  console.log('Assistant response:', result.data.message);
}

// Example 2: Creating an agent with integrations
async function createAgentWithShopifyIntegration() {
  // Step 1: Create the agent
  const agentResponse = await fetch('/api/agents/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: 'org-123',
      name: 'Shopify Support Agent',
      instructions: 'You are a helpful customer service agent for an e-commerce store. Help customers with orders, products, and general inquiries.',
      model: 'gpt-4o',
      tools: ['get_order', 'update_order', 'search_products'],
      agentConfig: {
        behavior: {
          responseStyle: 'friendly',
          maxResponseLength: 500,
          temperature: 0.7
        },
        rules: {
          canAccessCustomerData: true,
          canProcessPayments: false,
          escalationRules: [
            {
              keywords: ['refund', 'complaint', 'angry'],
              action: 'escalate'
            }
          ]
        }
      },
      isActive: true
    })
  });

  const agent = await agentResponse.json();
  console.log('Created agent:', agent.data.agent);

  // Step 2: Create a Shopify integration for this agent
  const integrationResponse = await fetch('/api/integrations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: 'org-123',
      agentId: agent.data.agent.id, // Link to the agent
      type: 'shopify',
      name: 'Main Store',
      credentials: {
        storeDomain: 'mystore.myshopify.com',
        accessToken: 'shpat_xxxxx' // This would be encrypted in the database
      },
      settings: {
        syncProducts: true,
        syncOrders: true,
        webhookUrl: 'https://myapi.com/webhooks/shopify'
      }
    })
  });

  const integration = await integrationResponse.json();
  console.log('Created integration:', integration.data.integration);

  return { agent: agent.data.agent, integration: integration.data.integration };
}

// Example 3: Chat with the agent (now it automatically uses its configured integrations)
async function chatWithConfiguredAgent(agentId: string) {
  const response = await fetch('/api/agents/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId: agentId,
      message: 'Can you help me track order #12345?',
      context: {
        customerId: 'customer-456',
        orderNumber: '12345'
      }
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Agent response:', result.data.message);
    console.log('Agent ID:', result.data.agentId);
    console.log('Timestamp:', result.data.timestamp);
  } else {
    console.error('Chat error:', result.error);
  }
}

// Example 4: Advanced agent configuration with multiple integrations
async function createAdvancedAgent() {
  // Create agent with advanced configuration
  const agent = await fetch('/api/agents/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationId: 'org-123',
      name: 'Multi-Platform Support Agent',
      instructions: `You are an advanced customer service agent with access to multiple platforms.
        - For order-related queries, use Shopify tools
        - For payment issues, use Stripe tools
        - Always be helpful and professional
        - Escalate complex technical issues to human agents`,
      model: 'gpt-4o',
      agentConfig: {
        behavior: {
          responseStyle: 'professional',
          temperature: 0.5,
          maxResponseLength: 800
        },
        rules: {
          canAccessCustomerData: true,
          canProcessPayments: true,
          canCreateOrders: false,
          escalationRules: [
            {
              keywords: ['technical issue', 'bug', 'not working'],
              conditions: ['user_frustrated', 'multiple_attempts'],
              action: 'transfer'
            }
          ]
        }
      }
    })
  }).then(r => r.json());

  // Create multiple integrations for this agent
  const shopifyIntegration = await fetch('/api/integrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationId: 'org-123',
      agentId: agent.data.agent.id,
      type: 'shopify',
      name: 'Primary Store',
      credentials: { /* ... */ },
      settings: { syncProducts: true, syncOrders: true }
    })
  }).then(r => r.json());

  const stripeIntegration = await fetch('/api/integrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationId: 'org-123',
      agentId: agent.data.agent.id,
      type: 'stripe',
      name: 'Payment Processing',
      credentials: { /* ... */ },
      settings: { webhookHandling: true }
    })
  }).then(r => r.json());

  console.log('Created advanced agent with multiple integrations');
  return { agent, shopifyIntegration, stripeIntegration };
}

export {
  sendChatMessage,
  createAgentWithShopifyIntegration,
  chatWithConfiguredAgent,
  createAdvancedAgent
};
