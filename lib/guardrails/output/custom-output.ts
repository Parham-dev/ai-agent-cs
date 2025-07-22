import { OutputGuardrail } from '@openai/agents';
import { evaluateCustomGuardrail } from '../agents/custom-evaluator-agent';
import { 
  extractTextContent,
  measureGuardrailExecution,
  createGuardrailLogger,
  getCachedResult,
  setCachedResult,
  generateCacheKey,
} from '../utils';

// Default threshold for custom output guardrail (0.7 = 70% confidence required to block)
const DEFAULT_CUSTOM_THRESHOLD = 0.7;

// Cache TTL for custom evaluation results (10 minutes)
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Custom Output Guardrail
 * 
 * Evaluates agent output against custom instructions defined by the user.
 * Blocks responses that violate the specified requirements.
 * 
 * @param instructions - Custom instructions for what to check
 * @param threshold - Confidence threshold (0.0-1.0) for blocking content
 */
export function createCustomOutputGuardrail(
  instructions: string,
  threshold?: number
): OutputGuardrail {
  return {
    name: 'Custom Output Guardrail',
    
    async execute({ agentOutput, context }) {
      const logger = createGuardrailLogger('custom-output', {
        agentId: 'custom-output-guardrail',
        agentName: 'Custom Output',
        organizationId: 'default',
        timestamp: new Date(),
      });
      
      return await measureGuardrailExecution(
        'custom-output',
        async () => {
          try {
            // Extract text content from agent output
            const textContent = extractTextContent(agentOutput);
            
            if (!textContent || textContent.trim().length === 0) {
              logger.info('Empty output - allowing through');
              return {
                outputInfo: {
                  passed: true,
                  confidence: 0.0,
                  violations: [],
                  reasoning: 'Empty output',
                },
                tripwireTriggered: false,
              };
            }
            
            // Check cache first
            const cacheKey = generateCacheKey('custom-output', textContent, { instructions, threshold });
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
            
            // Determine if response should be blocked
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
              logger.warn('Custom output guardrail triggered', {
                confidence: evaluationResult.confidence,
                violations: evaluationResult.violations,
                threshold: effectiveThreshold,
              });
            } else {
              logger.info('Output passed custom check', {
                confidence: evaluationResult.confidence,
                threshold: effectiveThreshold,
              });
            }
            
            return {
              outputInfo: result,
              tripwireTriggered: shouldBlock,
            };
            
          } catch (error) {
            logger.error('Custom output guardrail failed', {}, error as Error);
            
            // On error, be conservative and block the response
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
          logger.debug('Custom output guardrail performance', {
            executionTime: performance.executionTime,
            memoryUsage: performance.memoryUsage,
            success: performance.success,
          });
        }
      );
    },
  };
}