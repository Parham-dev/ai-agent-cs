import { Agent, run } from '@openai/agents';
import { z } from 'zod';

// Output schema for tone analysis
const ToneAnalysisOutput = z.object({
  isProfessional: z.boolean().describe('Whether the tone is professional and appropriate for customer service'),
  toneScore: z.number().min(0).max(1).describe('Professional tone score from 0 (unprofessional) to 1 (highly professional)'),
  sentiment: z.enum(['positive', 'neutral', 'negative']).describe('Overall sentiment of the response'),
  formality: z.enum(['formal', 'neutral', 'informal']).describe('Level of formality in the language'),
  issues: z.array(z.string()).describe('List of specific tone issues found'),
  suggestions: z.array(z.string()).describe('Suggestions for improving the tone'),
  reasoning: z.string().describe('Detailed explanation of the tone analysis'),
});

export type ToneAnalysisOutput = z.infer<typeof ToneAnalysisOutput>;

// Agent for analyzing professional tone
export const toneAnalyzerAgent = new Agent({
  name: 'Professional Tone Analyzer',
  instructions: `You are a professional communication expert that analyzes text for appropriateness in customer service contexts.

Your job is to evaluate whether a customer service response maintains a professional, helpful, and appropriate tone.

PROFESSIONAL TONE INCLUDES:
- Respectful and courteous language
- Clear and helpful communication
- Empathetic understanding of customer concerns
- Professional vocabulary and grammar
- Appropriate level of formality
- Solution-oriented approach
- Acknowledgment of customer issues

UNPROFESSIONAL TONE INCLUDES:
- Rude, dismissive, or condescending language
- Overly casual or informal language
- Defensive or argumentative responses
- Technical jargon without explanation
- Cold or robotic responses
- Blame-shifting or unhelpful responses
- Grammar or spelling errors that impact clarity

SCORING GUIDELINES:
- 1.0: Exemplary professional communication
- 0.8-0.9: Very professional with minor room for improvement
- 0.6-0.7: Generally professional but needs improvement
- 0.4-0.5: Some professional elements but notable issues
- 0.2-0.3: Mostly unprofessional with few redeeming qualities
- 0.0-0.1: Completely unprofessional or inappropriate

Consider the context of customer service where customers may be frustrated, and responses should be understanding while maintaining professionalism.

Provide specific, actionable suggestions for improvement when issues are found.`,

  model: 'gpt-4o-mini',
  outputType: ToneAnalysisOutput
});

// Helper function to analyze tone
export async function analyzeTone(content: string, context?: Record<string, unknown>): Promise<ToneAnalysisOutput> {
  try {
    const result = await run(toneAnalyzerAgent, content, { context });
    return result.finalOutput || {
      isProfessional: false,
      toneScore: 0.0,
      sentiment: 'neutral',
      formality: 'neutral',
      issues: ['analysis_failed'],
      suggestions: ['Please review the response for professional tone'],
      reasoning: 'Failed to analyze tone - defaulting to unprofessional',
    };
  } catch (error) {
    // If analysis fails, default to unprofessional to be safe
    return {
      isProfessional: false,
      toneScore: 0.0,
      sentiment: 'neutral',
      formality: 'neutral',
      issues: ['tone_analysis_error'],
      suggestions: ['Please review and revise the response'],
      reasoning: `Tone analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}