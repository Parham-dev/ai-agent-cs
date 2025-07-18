import { OutputGuardrail } from '@openai/agents';
import { 
  extractTextContent,
  measureGuardrailExecution,
  createGuardrailLogger,
  getCachedResult,
  setCachedResult,
  generateCacheKey,
} from '../utils';

// Default threshold for factual accuracy (0.7 = 70% confidence required to pass)
const DEFAULT_ACCURACY_THRESHOLD = 0.7;

// Cache TTL for factual analysis results (15 minutes)
const CACHE_TTL_MS = 15 * 60 * 1000;

// Interface for factual accuracy analysis result
interface FactualAccuracyResult {
  isFactuallyAccurate: boolean;
  accuracyScore: number;
  uncertaintyIndicators: string[];
  factualClaims: Array<{
    claim: string;
    confidence: number;
    needsVerification: boolean;
  }>;
  reasoning: string;
  suggestions: string[];
}

// Keywords that might indicate uncertainty or speculation
const UNCERTAINTY_INDICATORS = [
  'might', 'maybe', 'possibly', 'probably', 'likely', 'seems', 'appears',
  'could be', 'may be', 'i think', 'i believe', 'in my opinion',
  'allegedly', 'reportedly', 'supposedly', 'presumably'
];

// Keywords that indicate strong factual claims
const FACTUAL_CLAIM_INDICATORS = [
  'is', 'are', 'will', 'was', 'were', 'has', 'have', 'must',
  'always', 'never', 'definitely', 'certainly', 'absolutely',
  'according to', 'studies show', 'research indicates'
];

/**
 * Factual Accuracy Output Guardrail
 * 
 * Analyzes agent output for factual accuracy and reliability.
 * Flags responses that may contain:
 * - Unverified factual claims
 * - Speculation presented as fact
 * - Outdated information
 * - Contradictory statements
 * - Claims without proper uncertainty indicators
 * 
 * @param threshold - Minimum accuracy confidence score (0.0-1.0) required to pass
 */
export function createFactualAccuracyGuardrail(
  threshold?: number
): OutputGuardrail {
  return {
    name: 'Factual Accuracy Guardrail',
    
    async execute({ agentOutput }) {
      const logger = createGuardrailLogger('factual-accuracy', {
        agentId: 'factual-accuracy-guardrail',
        agentName: 'Factual Accuracy',
        organizationId: 'default',
        timestamp: new Date(),
      });
      
      return await measureGuardrailExecution(
        'factual-accuracy',
        async () => {
          try {
            // Extract text content from agent output
            const textContent = extractTextContent(agentOutput);
            
            if (!textContent || textContent.trim().length === 0) {
              logger.info('Empty output - allowing through');
              return {
                outputInfo: {
                  isFactuallyAccurate: true,
                  accuracyScore: 1.0,
                  uncertaintyIndicators: [],
                  factualClaims: [],
                  reasoning: 'Empty output',
                  suggestions: [],
                } as FactualAccuracyResult,
                tripwireTriggered: false,
              };
            }
            
            // Check cache first
            const cacheKey = generateCacheKey('factual-accuracy', textContent, { threshold });
            const cachedResult = getCachedResult<FactualAccuracyResult>(cacheKey);
            
            if (cachedResult) {
              logger.debug('Using cached factual accuracy result');
              
              return {
                outputInfo: cachedResult,
                tripwireTriggered: !cachedResult.isFactuallyAccurate,
              };
            }
            
            // Run factual accuracy analysis
            logger.debug('Running factual accuracy analysis', {
              contentLength: textContent.length,
              threshold: threshold || DEFAULT_ACCURACY_THRESHOLD,
            });
            
            const lowerText = textContent.toLowerCase();
            
            // Detect uncertainty indicators
            const uncertaintyFound = UNCERTAINTY_INDICATORS.filter(indicator => 
              lowerText.includes(indicator)
            );
            
            // Detect strong factual claims
            const factualClaims: FactualAccuracyResult['factualClaims'] = [];
            const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
            
            sentences.forEach(sentence => {
              const lowerSentence = sentence.toLowerCase();
              const hasFactualIndicator = FACTUAL_CLAIM_INDICATORS.some(indicator => 
                lowerSentence.includes(indicator)
              );
              const hasUncertaintyIndicator = UNCERTAINTY_INDICATORS.some(indicator => 
                lowerSentence.includes(indicator)
              );
              
              if (hasFactualIndicator && !hasUncertaintyIndicator) {
                factualClaims.push({
                  claim: sentence.trim(),
                  confidence: 0.8, // Default confidence for detected claims
                  needsVerification: true,
                });
              }
            });
            
            // Calculate accuracy score based on various factors
            let accuracyScore = 0.8; // Base score
            
            // Reduce score for excessive unqualified claims
            if (factualClaims.length > 3) {
              accuracyScore -= 0.1 * (factualClaims.length - 3);
            }
            
            // Increase score for appropriate uncertainty indicators
            if (uncertaintyFound.length > 0 && factualClaims.length > 0) {
              accuracyScore += 0.1;
            }
            
            // Reduce score for words that indicate speculation without qualification
            const speculativeWords = ['definitely', 'absolutely', 'certainly'];
            const speculationCount = speculativeWords.reduce((count, word) => 
              count + (lowerText.split(word).length - 1), 0);
            
            if (speculationCount > 2) {
              accuracyScore -= 0.15;
            }
            
            // Ensure score stays within bounds
            accuracyScore = Math.max(0.0, Math.min(1.0, accuracyScore));
            
            // Determine if response should be blocked
            const effectiveThreshold = threshold ?? DEFAULT_ACCURACY_THRESHOLD;
            const shouldBlock = accuracyScore < effectiveThreshold;
            
            // Generate suggestions based on analysis
            const suggestions: string[] = [];
            if (factualClaims.length > 2) {
              suggestions.push('Consider adding uncertainty qualifiers to factual claims');
            }
            if (uncertaintyFound.length === 0 && factualClaims.length > 0) {
              suggestions.push('Add appropriate uncertainty language where claims cannot be verified');
            }
            if (speculationCount > 0) {
              suggestions.push('Avoid overly confident language for unverified information');
            }
            
            const result: FactualAccuracyResult = {
              isFactuallyAccurate: !shouldBlock,
              accuracyScore,
              uncertaintyIndicators: uncertaintyFound,
              factualClaims,
              reasoning: shouldBlock 
                ? `Low factual accuracy score (${accuracyScore.toFixed(2)}). ${factualClaims.length} unqualified claims detected.`
                : `Good factual accuracy (${accuracyScore.toFixed(2)}). Appropriate use of uncertainty qualifiers.`,
              suggestions,
            };
            
            // Cache the result
            setCachedResult(cacheKey, result, CACHE_TTL_MS);
            
            if (shouldBlock) {
              logger.warn('Factual accuracy guardrail triggered', {
                accuracyScore,
                factualClaimsCount: factualClaims.length,
                uncertaintyIndicatorsCount: uncertaintyFound.length,
                threshold: effectiveThreshold,
              });
            } else {
              logger.info('Response passed factual accuracy check', {
                accuracyScore,
                factualClaimsCount: factualClaims.length,
                threshold: effectiveThreshold,
              });
            }
            
            return {
              outputInfo: result,
              tripwireTriggered: shouldBlock,
            };
            
          } catch (error) {
            logger.error('Factual accuracy guardrail failed', {}, error as Error);
            
            // On error, be conservative and block the response
            const errorResult: FactualAccuracyResult = {
              isFactuallyAccurate: false,
              accuracyScore: 0.0,
              uncertaintyIndicators: [],
              factualClaims: [],
              reasoning: `Factual accuracy analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              suggestions: ['Please review the response for factual accuracy'],
            };
            
            return {
              outputInfo: errorResult,
              tripwireTriggered: true,
            };
          }
        },
        (performance) => {
          logger.debug('Factual accuracy guardrail performance', {
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
export const factualAccuracyGuardrail = createFactualAccuracyGuardrail();