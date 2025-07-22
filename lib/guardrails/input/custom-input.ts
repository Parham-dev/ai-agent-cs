import { InputGuardrail } from '@openai/agents';
import { evaluateCustomGuardrail } from '../agents/custom-evaluator-agent';
import { 
  extractTextContent,
  measureGuardrailExecution,
  createGuardrailLogger,
  getCachedResult,
  setCachedResult,
  generateCacheKey,
} from '../utils';

// Default threshold for custom input guardrail (0.7 = 70% confidence required to block)
const DEFAULT_CUSTOM_THRESHOLD = 0.7;

// Cache TTL for custom evaluation results (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Custom Input Guardrail
 * 
 * Evaluates user input against custom instructions defined by the user.
 * Blocks content that violates the specified requirements.
 * 
 * @param instructions - Custom instructions for what to check
 * @param threshold - Confidence threshold (0.0-1.0) for blocking content
 */
export function createCustomInputGuardrail(
  instructions: string,
  threshold?: number
): InputGuardrail {
  return {
    name: 'Custom Input Guardrail',
    
    async execute({ input, context }) {
      const logger = createGuardrailLogger('custom-input', {
        agentId: 'custom-input-guardrail',
        agentName: 'Custom Input',
        organizationId: 'default',
        timestamp: new Date(),
      });
      
      return await measureGuardrailExecution(
        'custom-input',
        async () => {
          try {
            // Extract text content from input
            const textContent = extractTextContent(input);
            
            if (!textContent || textContent.trim().length === 0) {
              logger.info('Empty input - allowing through');
              return {
                outputInfo: {
                  passed: true,
                  confidence: 0.0,
                  violations: [],
                  reasoning: 'Empty input',
                },
                tripwireTriggered: false,
              };
            }
            
            // Check cache first
            const cacheKey = generateCacheKey('custom-input', textContent, { instructions, threshold });
            const cachedResult = getCachedResult<{ passed: boolean; confidence: number; violations: string[]; reasoning: string }>(cacheKey);
            
            if (cachedResult) {
              logger.debug('Using cached custom evaluation result');
              
              return {
                outputInfo: cachedResult,
                tripwireTriggered: !cachedResult.passed,
              };
            }
            
            // Run custom evaluation
            logger.debug('Running custom evaluation', {
              contentLength: textContent.length,
              instructionsLength: instructions.length,
              threshold: threshold || DEFAULT_CUSTOM_THRESHOLD,
            });
            
            const evaluationResult = await evaluateCustomGuardrail(textContent, instructions, context as unknown as Record<string, unknown>);
            
            // Determine if content should be blocked
            const effectiveThreshold = threshold ?? DEFAULT_CUSTOM_THRESHOLD;
            const shouldBlock = !evaluationResult.passed && evaluationResult.confidence >= effectiveThreshold;
            
            const result = {
              passed: evaluationResult.passed,
              confidence: evaluationResult.confidence,
              violations: evaluationResult.violations,
              reasoning: evaluationResult.reasoning,
            };
            
            // Cache the result
            setCachedResult(cacheKey, result, CACHE_TTL_MS);
            
            if (shouldBlock) {
              logger.warn('Custom input guardrail triggered', {
                confidence: evaluationResult.confidence,
                violations: evaluationResult.violations,
                threshold: effectiveThreshold,
              });
            } else {
              logger.info('Input passed custom check', {
                confidence: evaluationResult.confidence,
                threshold: effectiveThreshold,
              });
            }
            
            return {
              outputInfo: result,
              tripwireTriggered: shouldBlock,
            };
            
          } catch (error) {
            logger.error('Custom input guardrail failed', {}, error as Error);
            
            // On error, be conservative and block the content
            const errorResult = {
              passed: false,
              confidence: 1.0,
              violations: ['guardrail_error'],
              reasoning: `Custom check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
            
            return {
              outputInfo: errorResult,
              tripwireTriggered: true,
            };
          }
        },
        (performance) => {
          logger.debug('Custom input guardrail performance', {
            executionTime: performance.executionTime,
            memoryUsage: performance.memoryUsage,
            success: performance.success,
          });
        }
      );
    },
  };
}