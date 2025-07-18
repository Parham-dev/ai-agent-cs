import { OutputGuardrail } from '@openai/agents';
import { analyzeTone } from '../agents/tone-analyzer-agent';
import { 
  extractTextContent,
  checkThreshold,
  measureGuardrailExecution,
  createGuardrailLogger,
  getCachedResult,
  setCachedResult,
  generateCacheKey,
} from '../utils';
import { ToneAnalysisResult } from '../types';

// Default threshold for professional tone (0.6 = 60% professional score required)
const DEFAULT_TONE_THRESHOLD = 0.6;

// Cache TTL for tone analysis results (10 minutes)
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Professional Tone Output Guardrail
 * 
 * Analyzes agent output to ensure professional, appropriate tone for customer service.
 * Blocks responses that are:
 * - Unprofessional or inappropriate
 * - Rude, dismissive, or condescending
 * - Overly casual or informal
 * - Defensive or argumentative
 * - Cold or unhelpful
 * 
 * @param threshold - Minimum professional tone score (0.0-1.0) required to pass
 */
export function createProfessionalToneGuardrail(
  threshold?: number
): OutputGuardrail {
  return {
    name: 'Professional Tone Guardrail',
    
    async execute({ agentOutput, context }) {
      const logger = createGuardrailLogger('professional-tone', {
        agentId: 'professional-tone-guardrail',
        agentName: 'Professional Tone',
        organizationId: 'default',
        timestamp: new Date(),
      });
      
      return await measureGuardrailExecution(
        'professional-tone',
        async () => {
          try {
            // Extract text content from agent output
            const textContent = extractTextContent(agentOutput);
            
            if (!textContent || textContent.trim().length === 0) {
              logger.info('Empty output - allowing through');
              return {
                outputInfo: {
                  isProfessional: true,
                  toneScore: 1.0,
                  sentiment: 'neutral',
                  formality: 'neutral',
                  issues: [],
                  suggestions: [],
                  reasoning: 'Empty output',
                } as ToneAnalysisResult,
                tripwireTriggered: false,
              };
            }
            
            // Check cache first
            const cacheKey = generateCacheKey('professional-tone', textContent, { threshold });
            const cachedResult = getCachedResult<ToneAnalysisResult>(cacheKey);
            
            if (cachedResult) {
              logger.debug('Using cached tone analysis result');
              
              return {
                outputInfo: cachedResult,
                tripwireTriggered: !cachedResult.isProfessional,
              };
            }
            
            // Run tone analysis
            logger.debug('Running tone analysis', {
              contentLength: textContent.length,
              threshold: threshold || DEFAULT_TONE_THRESHOLD,
            });
            
            const analysisResult = await analyzeTone(textContent, context as unknown as Record<string, unknown>);
            
            // Determine if response should be blocked
            const effectiveThreshold = threshold ?? DEFAULT_TONE_THRESHOLD;
              
            const shouldBlock = !analysisResult.isProfessional || 
              !checkThreshold(analysisResult.toneScore, effectiveThreshold, 0.0);
            
            const result: ToneAnalysisResult = {
              isProfessional: analysisResult.isProfessional,
              toneScore: analysisResult.toneScore,
              sentiment: analysisResult.sentiment,
              formality: analysisResult.formality,
              issues: analysisResult.issues,
              suggestions: analysisResult.suggestions,
              reasoning: analysisResult.reasoning,
            };
            
            // Cache the result
            setCachedResult(cacheKey, result, CACHE_TTL_MS);
            
            if (shouldBlock) {
              logger.warn('Professional tone guardrail triggered', {
                toneScore: analysisResult.toneScore,
                sentiment: analysisResult.sentiment,
                formality: analysisResult.formality,
                issues: analysisResult.issues,
                threshold: effectiveThreshold,
              });
            } else {
              logger.info('Response passed tone check', {
                toneScore: analysisResult.toneScore,
                sentiment: analysisResult.sentiment,
                formality: analysisResult.formality,
                threshold: effectiveThreshold,
              });
            }
            
            return {
              outputInfo: result,
              tripwireTriggered: shouldBlock,
            };
            
          } catch (error) {
            logger.error('Professional tone guardrail failed', {}, error as Error);
            
            // On error, be conservative and block the response
            const errorResult: ToneAnalysisResult = {
              isProfessional: false,
              toneScore: 0.0,
              sentiment: 'neutral',
              formality: 'neutral',
              issues: ['guardrail_error'],
              suggestions: ['Please review and revise the response'],
              reasoning: `Tone analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
            
            return {
              outputInfo: errorResult,
              tripwireTriggered: true,
            };
          }
        },
        (performance) => {
          logger.debug('Professional tone guardrail performance', {
            executionTime: performance.executionTime,
            memoryUsage: performance.memoryUsage,
            success: performance.success,
          });
        }
      );
    },
  };
}

// Export default instance with standard threshold
export const professionalToneGuardrail = createProfessionalToneGuardrail();