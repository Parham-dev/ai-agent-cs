import { tool } from '@openai/agents';
import { z } from 'zod';

export const addNumbers = tool({
  name: 'add_numbers',
  description: 'Add two numbers together and return the result',
  parameters: z.object({
    a: z.number().describe('The first number to add'),
    b: z.number().describe('The second number to add'),
  }),
  execute: async ({ a, b }) => {
    const result = a + b;
    return {
      result,
      calculation: `${a} + ${b} = ${result}`,
    };
  },
});