import { InputGuardrail } from '@openai/agents';
import { moderateContent } from '../agents/moderation-agent';
import { 
  extractTextContent,
  checkThreshold,
  measureGuardrailExecution,
  createGuardrailLogger,
  getCachedResult,
  setCachedResult,
  generateCacheKey,
} from '../utils';
import { ContentSafetyResult } from '../types';

// Default threshold for content safety (0.8 = 80% confidence required to block)
const DEFAULT_SAFETY_THRESHOLD = 0.8;

// Cache TTL for content safety results (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Content Safety Input Guardrail
 * 
 * Analyzes user input for inappropriate content before processing by the agent.
 * Blocks content that contains:
 * - Toxicity (rude, disrespectful language)
 * - Threats or violence
 * - Harassment or bullying
 * - Hate speech
 * - Spam or promotional content
 * 
 * @param threshold - Confidence threshold (0.0-1.0) for blocking content
 */
export function createContentSafetyGuardrail(threshold?: number): InputGuardrail {
  return {
    name: 'Content Safety Guardrail',
    
    async execute({ input, context }) {
      const logger = createGuardrailLogger('content-safety', {
        agentId: 'content-safety-guardrail',
        agentName: 'Content Safety',
        organizationId: 'default',
        timestamp: new Date(),
      });
      
      return await measureGuardrailExecution(
        'content-safety',
        async () => {
          try {
            // Extract text content from input
            const textContent = extractTextContent(input);
            
            if (!textContent || textContent.trim().length === 0) {
              logger.info('Empty input - allowing through');
              return {
                outputInfo: {
                  isSafe: true,
                  toxicity: 0.0,
                  threat: 0.0,
                  harassment: 0.0,
                  hateSpeech: 0.0,
                  categories: [],
                  reasoning: 'Empty input',
                } as ContentSafetyResult,
                tripwireTriggered: false,
              };
            }
            
            // Check cache first
            const cacheKey = generateCacheKey('content-safety', textContent, { threshold });
            const cachedResult = getCachedResult<ContentSafetyResult>(cacheKey);
            
            if (cachedResult) {
              logger.debug('Using cached content safety result');
              
              return {
                outputInfo: cachedResult,
                tripwireTriggered: !cachedResult.isSafe,
              };
            }
            
            // Run content moderation
            logger.debug('Running content moderation', {
              contentLength: textContent.length,
              threshold: threshold || DEFAULT_SAFETY_THRESHOLD,
            });
            
            const moderationResult = await moderateContent(textContent, context as unknown as Record<string, unknown>);
            
            // Determine if content should be blocked
            const effectiveThreshold = threshold ?? DEFAULT_SAFETY_THRESHOLD;
              
            const shouldBlock = !moderationResult.isSafe || 
              checkThreshold(moderationResult.toxicity, effectiveThreshold) ||
              checkThreshold(moderationResult.threat, effectiveThreshold) ||
              checkThreshold(moderationResult.harassment, effectiveThreshold) ||
              checkThreshold(moderationResult.hateSpeech, effectiveThreshold);
            
            const result: ContentSafetyResult = {
              isSafe: !shouldBlock,
              toxicity: moderationResult.toxicity,
              threat: moderationResult.threat,
              harassment: moderationResult.harassment,
              hateSpeech: moderationResult.hateSpeech,
              categories: moderationResult.categories,
              reasoning: moderationResult.reasoning,
            };
            
            // Cache the result
            setCachedResult(cacheKey, result, CACHE_TTL_MS);
            
            if (shouldBlock) {
              logger.warn('Content safety guardrail triggered', {
                toxicity: moderationResult.toxicity,
                threat: moderationResult.threat,
                harassment: moderationResult.harassment,
                hateSpeech: moderationResult.hateSpeech,
                categories: moderationResult.categories,
                threshold: effectiveThreshold,
              });
            } else {
              logger.info('Content passed safety check', {
                maxScore: Math.max(
                  moderationResult.toxicity,
                  moderationResult.threat,
                  moderationResult.harassment,
                  moderationResult.hateSpeech
                ),
                threshold: effectiveThreshold,
              });
            }
            
            return {
              outputInfo: result,
              tripwireTriggered: shouldBlock,
            };
            
          } catch (error) {
            logger.error('Content safety guardrail failed', {}, error as Error);
            
            // On error, be conservative and block the content
            const errorResult: ContentSafetyResult = {
              isSafe: false,
              toxicity: 1.0,
              threat: 0.0,
              harassment: 0.0,
              hateSpeech: 0.0,
              categories: ['guardrail_error'],
              reasoning: `Content safety check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
            
            return {
              outputInfo: errorResult,
              tripwireTriggered: true,
            };
          }
        },
        (performance) => {
          logger.debug('Content safety guardrail performance', {
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
export const contentSafetyGuardrail = createContentSafetyGuardrail();