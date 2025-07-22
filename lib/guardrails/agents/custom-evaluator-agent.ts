import { Agent, run } from '@openai/agents';
import { z } from 'zod';

// Output schema for custom guardrail evaluation
const CustomEvaluationOutput = z.object({
  passed: z.boolean().describe('Whether the content passes the custom guardrail'),
  confidence: z.number().min(0).max(1).describe('Confidence score from 0 (low) to 1 (high)'),
  violations: z.array(z.string()).describe('List of specific violations found'),
  reasoning: z.string().describe('Detailed explanation of the evaluation'),
});

export type CustomEvaluationOutput = z.infer<typeof CustomEvaluationOutput>;

// Lightweight agent for custom guardrail evaluation
export const customEvaluatorAgent = new Agent({
  name: 'Custom Guardrail Evaluator',
  instructions: `You are a content evaluation AI that checks if text content meets specific custom requirements.

You will be given:
1. The content to evaluate
2. Custom instructions describing what to check for

Your job is to:
1. Carefully analyze the content against the provided instructions
2. Determine if the content violates any of the specified requirements
3. Provide a confidence score for your evaluation (0.0 to 1.0)
4. List any specific violations found
5. Provide clear reasoning for your decision

Be thorough but fair in your evaluation. Follow the custom instructions precisely.`,

  model: 'gpt-4o-mini',
  outputType: CustomEvaluationOutput,
});

// Helper function to run custom evaluation
export async function evaluateCustomGuardrail(
  content: string, 
  instructions: string, 
  context?: Record<string, unknown>
): Promise<CustomEvaluationOutput> {
  try {
    const prompt = `
Custom Guardrail Instructions:
${instructions}

Content to Evaluate:
${content}
`;

    const result = await run(customEvaluatorAgent, prompt, { context });
    return result.finalOutput || {
      passed: false,
      confidence: 1.0,
      violations: ['evaluation_failed'],
      reasoning: 'Failed to evaluate content - defaulting to blocked',
    };
  } catch (error) {
    // If evaluation fails, default to blocking
    return {
      passed: false,
      confidence: 1.0,
      violations: ['evaluation_error'],
      reasoning: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}