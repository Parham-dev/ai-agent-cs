import { customerMemory } from './custom';
import { webSearchTool } from './openai';

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  type: 'openai' | 'custom';
  category: 'calculation' | 'search' | 'memory';
  enabled: boolean;
}

export const AVAILABLE_TOOLS: ToolConfig[] = [
  {
    id: 'customer_memory',
    name: 'Customer Memory',
    description: 'Save and retrieve customer preferences, context, and conversation history',
    type: 'custom',
    category: 'memory',
    enabled: true,
  },
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the web for current information and real-time data',
    type: 'openai',
    category: 'search',
    enabled: true,
  },
];

export function getCustomTools(enabledToolIds?: string[]) {
  const tools = [];
  
  if (!enabledToolIds || enabledToolIds.includes('customer_memory')) {
    tools.push(customerMemory);
  }
  
  return tools;
}

export function getOpenAITools(enabledToolIds?: string[]) {
  const tools = [];
  
  if (!enabledToolIds || enabledToolIds.includes('web_search')) {
    tools.push(webSearchTool);
  }
  
  return tools;
}

export function getAllTools(enabledToolIds?: string[]) {
  return {
    customTools: getCustomTools(enabledToolIds),
    openaiTools: getOpenAITools(enabledToolIds),
  };
}