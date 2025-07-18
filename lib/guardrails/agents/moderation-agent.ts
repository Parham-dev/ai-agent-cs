import { Agent, run } from '@openai/agents';
import { z } from 'zod';

// Output schema for content moderation analysis
const ContentModerationOutput = z.object({
  isSafe: z.boolean().describe('Whether the content is safe and appropriate'),
  toxicity: z.number().min(0).max(1).describe('Toxicity score from 0 (safe) to 1 (toxic)'),
  threat: z.number().min(0).max(1).describe('Threat level from 0 (safe) to 1 (threatening)'),
  harassment: z.number().min(0).max(1).describe('Harassment score from 0 (safe) to 1 (harassing)'),
  hateSpeech: z.number().min(0).max(1).describe('Hate speech score from 0 (safe) to 1 (hate speech)'),
  categories: z.array(z.string()).describe('List of violated content categories'),
  reasoning: z.string().describe('Explanation of the moderation decision'),
});

export type ContentModerationOutput = z.infer<typeof ContentModerationOutput>;

// Lightweight agent for content moderation
export const moderationAgent = new Agent({
  name: 'Content Moderation Agent',
  instructions: `You are a content moderation AI that analyzes text for safety and appropriateness.

Your job is to:
1. Analyze the given text for inappropriate content including:
   - Toxicity (rude, disrespectful, unreasonable language)
   - Threats (threats of violence or harm)
   - Harassment (bullying, intimidation, abuse)
   - Hate speech (attacks based on identity/protected characteristics)
   - Spam or promotional content
   - Profanity or explicit content

2. Score each category from 0.0 (completely safe) to 1.0 (highly problematic)

3. Determine if the content is safe for a customer service context

4. Provide clear reasoning for your decision

Be conservative but fair - customer service should maintain professional standards while not being overly restrictive of legitimate customer concerns or complaints.

Consider context: A customer expressing frustration about poor service is different from someone being abusive to staff.`,

  model: 'gpt-4o-mini',
  outputType: ContentModerationOutput,
});

// Helper function to run content moderation
export async function moderateContent(content: string, context?: Record<string, unknown>): Promise<ContentModerationOutput> {
  try {
    const result = await run(moderationAgent, content, { context });
    return result.finalOutput || {
      isSafe: false,
      toxicity: 1.0,
      threat: 0.0,
      harassment: 0.0,
      hateSpeech: 0.0,
      categories: ['analysis_failed'],
      reasoning: 'Failed to analyze content - defaulting to unsafe',
    };
  } catch (error) {
    // If moderation fails, default to unsafe
    return {
      isSafe: false,
      toxicity: 1.0,
      threat: 0.0,
      harassment: 0.0,
      hateSpeech: 0.0,
      categories: ['moderation_error'],
      reasoning: `Moderation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}