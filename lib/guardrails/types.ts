import { InputGuardrail, OutputGuardrail } from '@openai/agents';

// Guardrail configuration for registry
export interface GuardrailConfig {
  id: string;
  name: string;
  description: string;
  type: 'input' | 'output';
  category: 'safety' | 'quality' | 'compliance' | 'performance';
  enabled: boolean;
  configurable: boolean;
  defaultThreshold?: number;
  thresholds?: Record<string, number>;
}

// Agent guardrails configuration (stored in database)
export interface AgentGuardrailsConfig {
  input: string[];      // Array of enabled input guardrail IDs
  output: string[];     // Array of enabled output guardrail IDs
  thresholds?: {
    contentSafety?: number;        // 0.0 - 1.0
    professionalTone?: number;     // 0.0 - 1.0
    privacyProtection?: number;    // 0.0 - 1.0
    factualAccuracy?: number;      // 0.0 - 1.0
  };
}

// Guardrail execution result
export interface GuardrailResult {
  triggered: boolean;
  confidence: number;
  reason?: string;
  details?: Record<string, unknown>;
  executionTimeMs: number;
}

// Guardrail analytics and monitoring
export interface GuardrailMetrics {
  guardrailId: string;
  guardrailName: string;
  agentId: string;
  triggeredCount: number;
  totalExecutions: number;
  averageExecutionTime: number;
  lastTriggered?: Date;
  errorCount: number;
}

// Content safety analysis result
export interface ContentSafetyResult {
  isSafe: boolean;
  toxicity: number;
  threat: number;
  harassment: number;
  hateSpeech: number;
  categories: string[];
  reasoning: string;
}

// Professional tone analysis result
export interface ToneAnalysisResult {
  isProfessional: boolean;
  toneScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  formality: 'formal' | 'neutral' | 'informal';
  issues: string[];
  suggestions: string[];
  reasoning: string;
}

// Privacy protection analysis result
export interface PrivacyAnalysisResult {
  containsPII: boolean;
  piiTypes: string[];
  locations: Array<{
    type: string;
    text: string;
    start: number;
    end: number;
  }>;
  sanitizedText?: string;
  reasoning: string;
}

// Guardrail execution context
export interface GuardrailExecutionContext {
  agentId: string;
  agentName: string;
  organizationId: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  thresholds?: Record<string, number>;
}

// Guardrail factory function types
export type InputGuardrailFactory = (config?: Partial<GuardrailConfig>) => InputGuardrail;
export type OutputGuardrailFactory = (config?: Partial<GuardrailConfig>) => OutputGuardrail;

// Registry types
export interface GuardrailRegistry {
  input: Map<string, InputGuardrailFactory>;
  output: Map<string, OutputGuardrailFactory>;
  configs: Map<string, GuardrailConfig>;
}

// Error types for guardrail failures
export interface GuardrailError extends Error {
  guardrailId: string;
  guardrailName: string;
  reason: string;
  details?: Record<string, unknown>;
}

// Guardrail performance monitoring
export interface GuardrailPerformance {
  guardrailId: string;
  executionTime: number;
  memoryUsage?: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}