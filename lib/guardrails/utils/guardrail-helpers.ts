import { GuardrailExecutionContext, GuardrailResult, GuardrailPerformance } from '../types';
import { createApiLogger } from '@/lib/utils/logger';

/**
 * Utility functions for guardrail execution and monitoring
 */

// Create a standardized logger for guardrails
export function createGuardrailLogger(guardrailId: string, context: GuardrailExecutionContext) {
  return createApiLogger({
    endpoint: `/guardrails/${guardrailId}`,
    agentId: context.agentId,
    requestId: context.sessionId || crypto.randomUUID(),
    userAgent: 'guardrail-system',
  });
}

// Measure guardrail execution time and performance
export async function measureGuardrailExecution<T>(
  guardrailId: string,
  executionFn: () => Promise<T>,
  onPerformance?: (performance: GuardrailPerformance) => void
): Promise<T> {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  try {
    const result = await executionFn();
    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    const performance: GuardrailPerformance = {
      guardrailId,
      executionTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      success: true,
      timestamp: new Date(),
    };
    
    onPerformance?.(performance);
    return result;
  } catch (error) {
    const endTime = Date.now();
    
    const performance: GuardrailPerformance = {
      guardrailId,
      executionTime: endTime - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
    
    onPerformance?.(performance);
    throw error;
  }
}

// Sanitize content for logging (remove sensitive information)
export function sanitizeContentForLogging(content: string, maxLength: number = 200): string {
  // Remove potential PII patterns
  let sanitized = content
    .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL]')           // Email addresses
    .replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '[SSN]')               // SSN patterns
    .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[CARD]') // Credit card patterns
    .replace(/\b\d{3}-?\d{3}-?\d{4}\b/g, '[PHONE]')             // Phone numbers
    .replace(/\b\d{1,5}\s+[\w\s]{1,50}\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Place|Pl)\b/gi, '[ADDRESS]'); // Addresses
  
  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }
  
  return sanitized;
}

// Check if content exceeds threshold
export function checkThreshold(
  score: number,
  threshold: number,
  defaultThreshold: number = 0.8
): boolean {
  const effectiveThreshold = threshold ?? defaultThreshold;
  return score >= effectiveThreshold;
}

// Format guardrail result for consistent output
export function formatGuardrailResult(
  triggered: boolean,
  confidence: number,
  reason: string,
  details?: Record<string, unknown>,
  executionTime?: number
): GuardrailResult {
  return {
    triggered,
    confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
    reason,
    details,
    executionTimeMs: executionTime || 0,
  };
}

// Extract text content from various input formats
export function extractTextContent(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }
  
  if (typeof input === 'object' && input !== null) {
    // Handle common object structures
    const obj = input as Record<string, unknown>;
    
    // Check for common text fields
    if (obj.text && typeof obj.text === 'string') {
      return obj.text;
    }
    if (obj.content && typeof obj.content === 'string') {
      return obj.content;
    }
    if (obj.message && typeof obj.message === 'string') {
      return obj.message;
    }
    
    // Fallback to JSON string
    return JSON.stringify(input);
  }
  
  return String(input);
}

// Validate guardrail configuration
export function validateGuardrailConfig(config: Record<string, unknown>): boolean {
  // Basic validation for guardrail configuration
  if (!config.id || typeof config.id !== 'string') {
    return false;
  }
  
  if (!config.name || typeof config.name !== 'string') {
    return false;
  }
  
  if (!config.type || !['input', 'output'].includes(config.type as string)) {
    return false;
  }
  
  return true;
}

// Rate limiting for guardrail execution
const executionCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  guardrailId: string,
  maxExecutions: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const key = guardrailId;
  
  const current = executionCounts.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize counter
    executionCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxExecutions) {
    return false; // Rate limit exceeded
  }
  
  current.count++;
  return true;
}

// Cache for guardrail results (simple in-memory cache)
const resultCache = new Map<string, { result: unknown; expiry: number }>();

export function getCachedResult<T>(cacheKey: string): T | null {
  const cached = resultCache.get(cacheKey);
  
  if (!cached || Date.now() > cached.expiry) {
    resultCache.delete(cacheKey);
    return null;
  }
  
  return cached.result as T;
}

export function setCachedResult<T>(
  cacheKey: string,
  result: T,
  ttlMs: number = 300000 // 5 minutes
): void {
  resultCache.set(cacheKey, {
    result,
    expiry: Date.now() + ttlMs,
  });
}

// Generate cache key for guardrail results
export function generateCacheKey(
  guardrailId: string,
  content: string,
  context?: Record<string, unknown>
): string {
  const contentHash = hashString(content);
  const contextHash = context ? hashString(JSON.stringify(context)) : '';
  return `${guardrailId}:${contentHash}:${contextHash}`;
}

// Simple string hash function
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}