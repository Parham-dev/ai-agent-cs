import { addNumbers } from './custom';
import { webSearchTool } from './openai';

export interface ToolConfig {
  id: string;
  name: string;
  type: 'openai' | 'custom';
  category: 'calculation' | 'search';
  enabled: boolean;
}

export const AVAILABLE_TOOLS: ToolConfig[] = [
  {
    id: 'add_numbers',
    name: 'Add Numbers',
    type: 'custom',
    category: 'calculation',
    enabled: true,
  },
  {
    id: 'web_search',
    name: 'Web Search',
    type: 'openai',
    category: 'search',
    enabled: true,
  },
];

export function getCustomTools(enabledToolIds?: string[]) {
  const tools = [];
  
  if (!enabledToolIds || enabledToolIds.includes('add_numbers')) {
    tools.push(addNumbers);
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