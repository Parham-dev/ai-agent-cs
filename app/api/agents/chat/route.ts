import { NextRequest, NextResponse } from 'next/server';
import { run, Agent } from '@openai/agents';
import { createShopifyTools } from '@/lib/integrations/shopify/tools';
import { ShopifyCredentials } from '@/lib/integrations/shopify/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory: Message[];
  agentConfig: {
    name: string;
    instructions: string;
    integrations: {
      type: 'shopify';
      credentials: ShopifyCredentials;
    }[];
    tools: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, agentConfig }: ChatRequest = await request.json();

    if (!message || !agentConfig) {
      return NextResponse.json({
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Build tools based on agent configuration
    const tools = [];
    
    // Add integration-specific tools
    for (const integration of agentConfig.integrations) {
      switch (integration.type) {
        case 'shopify':
          tools.push(...createShopifyTools(integration.credentials));
          break;
        // Future integrations will be added here
        default:
          console.warn(`Unknown integration type: ${integration.type}`);
      }
    }

    // Add universal tools based on configuration
    // TODO: Add OpenAI hosted tools, MCP tools, custom tools based on agentConfig.tools

    if (tools.length === 0) {
      return NextResponse.json({
        message: 'No tools configured for this agent. Please set up integrations first.'
      }, { status: 400 });
    }

    // Create the agent
    const agent = new Agent({
      name: agentConfig.name,
      instructions: agentConfig.instructions,
      tools,
    });

    // Build conversation context
    const conversationMessages = conversationHistory.length > 0 
      ? conversationHistory.map((msg: Message) => `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}`).join('\n') + '\n'
      : '';
    
    const fullMessage = conversationMessages + `Customer: ${message}`;

    // Run the agent
    const response = await run(agent, fullMessage, {
      context: {
        agentName: agentConfig.name,
        integrations: agentConfig.integrations.map(i => i.type),
      },
    });

    return NextResponse.json({
      message: response.finalOutput || 'I apologize, but I encountered an issue processing your request.'
    });

  } catch (error) {
    console.error('Universal chat error:', error);
    
    return NextResponse.json({
      message: 'I apologize, but I encountered an error while processing your request. Please try again.',
    }, { status: 500 });
  }
} 