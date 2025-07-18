import { InputGuardrail } from '@openai/agents';
import { 
  extractTextContent,
  measureGuardrailExecution,
  createGuardrailLogger,
  getCachedResult,
  setCachedResult,
  generateCacheKey,
} from '../utils';
import { PrivacyAnalysisResult } from '../types';

// Default threshold for privacy protection (0.7 = 70% confidence required to block)
const DEFAULT_PRIVACY_THRESHOLD = 0.7;

// Cache TTL for privacy analysis results (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;

// Simple PII detection patterns
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
  address: /\b\d{1,5}\s+[\w\s]{1,50}\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Place|Pl)\b/gi,
};

/**
 * Privacy Protection Input Guardrail
 * 
 * Analyzes user input for personally identifiable information (PII) and sensitive data.
 * Blocks content that contains:
 * - Email addresses
 * - Phone numbers
 * - Social Security Numbers
 * - Credit card numbers
 * - Physical addresses
 * - Other sensitive personal information
 * 
 * @param threshold - Confidence threshold (0.0-1.0) for blocking content with PII
 */
export function createPrivacyProtectionGuardrail(threshold?: number): InputGuardrail {
  return {
    name: 'Privacy Protection Guardrail',
    
    async execute({ input }) {
      const logger = createGuardrailLogger('privacy-protection', {
        agentId: 'privacy-protection-guardrail',
        agentName: 'Privacy Protection',
        organizationId: 'default',
        timestamp: new Date(),
      });
      
      return await measureGuardrailExecution(
        'privacy-protection',
        async () => {
          try {
            // Extract text content from input
            const textContent = extractTextContent(input);
            
            if (!textContent || textContent.trim().length === 0) {
              logger.info('Empty input - allowing through');
              return {
                outputInfo: {
                  containsPII: false,
                  piiTypes: [],
                  locations: [],
                  reasoning: 'Empty input',
                } as PrivacyAnalysisResult,
                tripwireTriggered: false,
              };
            }
            
            // Check cache first
            const cacheKey = generateCacheKey('privacy-protection', textContent, { threshold });
            const cachedResult = getCachedResult<PrivacyAnalysisResult>(cacheKey);
            
            if (cachedResult) {
              logger.debug('Using cached privacy analysis result');
              
              return {
                outputInfo: cachedResult,
                tripwireTriggered: cachedResult.containsPII,
              };
            }
            
            // Run PII detection
            logger.debug('Running PII detection', {
              contentLength: textContent.length,
              threshold: threshold || DEFAULT_PRIVACY_THRESHOLD,
            });
            
            const piiDetected: Array<{
              type: string;
              text: string;
              start: number;
              end: number;
            }> = [];
            
            const piiTypes: string[] = [];
            
            // Check for each PII type
            Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
              const matches = textContent.matchAll(pattern);
              for (const match of matches) {
                if (match.index !== undefined) {
                  piiDetected.push({
                    type,
                    text: match[0],
                    start: match.index,
                    end: match.index + match[0].length,
                  });
                  if (!piiTypes.includes(type)) {
                    piiTypes.push(type);
                  }
                }
              }
            });
            
            // Determine if content should be blocked
            const effectiveThreshold = threshold ?? DEFAULT_PRIVACY_THRESHOLD;
            const containsPII = piiDetected.length > 0;
            
            // Calculate confidence based on number and type of PII detected
            const confidence = Math.min(piiDetected.length * 0.3, 1.0);
            const shouldBlock = containsPII && confidence >= effectiveThreshold;
            
            // Create sanitized version (replace PII with placeholders)
            let sanitizedText = textContent;
            piiDetected.forEach(({ type, text }) => {
              const placeholder = `[${type.toUpperCase()}]`;
              sanitizedText = sanitizedText.replace(text, placeholder);
            });
            
            const result: PrivacyAnalysisResult = {
              containsPII,
              piiTypes,
              locations: piiDetected,
              sanitizedText: containsPII ? sanitizedText : undefined,
              reasoning: containsPII 
                ? `Detected ${piiTypes.join(', ')} in user input`
                : 'No personally identifiable information detected',
            };
            
            // Cache the result
            setCachedResult(cacheKey, result, CACHE_TTL_MS);
            
            if (shouldBlock) {
              logger.warn('Privacy protection guardrail triggered', {
                piiTypes,
                piiCount: piiDetected.length,
                confidence,
                threshold: effectiveThreshold,
              });
            } else {
              logger.info('Content passed privacy check', {
                piiCount: piiDetected.length,
                threshold: effectiveThreshold,
              });
            }
            
            return {
              outputInfo: result,
              tripwireTriggered: shouldBlock,
            };
            
          } catch (error) {
            logger.error('Privacy protection guardrail failed', {}, error as Error);
            
            // On error, be conservative and block the content
            const errorResult: PrivacyAnalysisResult = {
              containsPII: true,
              piiTypes: ['detection_error'],
              locations: [],
              reasoning: `Privacy analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
            
            return {
              outputInfo: errorResult,
              tripwireTriggered: true,
            };
          }
        },
        (performance) => {
          logger.debug('Privacy protection guardrail performance', {
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
export const privacyProtectionGuardrail = createPrivacyProtectionGuardrail();