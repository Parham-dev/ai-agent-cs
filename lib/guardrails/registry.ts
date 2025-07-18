import { InputGuardrail, OutputGuardrail } from '@openai/agents';
import { GuardrailConfig, InputGuardrailFactory, OutputGuardrailFactory } from './types';

// Import guardrail factories
import { createContentSafetyGuardrail, createPrivacyProtectionGuardrail } from './input';
import { createProfessionalToneGuardrail, createFactualAccuracyGuardrail } from './output';

// Available guardrails registry
export const AVAILABLE_GUARDRAILS: GuardrailConfig[] = [
  // Input Guardrails
  {
    id: 'content-safety',
    name: 'Content Safety',
    description: 'Detects inappropriate, toxic, or harmful content in user input',
    type: 'input',
    category: 'safety',
    enabled: true,
    configurable: true,
    defaultThreshold: 0.8,
    thresholds: {
      toxicity: 0.8,
      threat: 0.8,
      harassment: 0.8,
      hateSpeech: 0.8,
    },
  },
  
  {
    id: 'privacy-protection',
    name: 'Privacy Protection',
    description: 'Detects and blocks personally identifiable information (PII)',
    type: 'input',
    category: 'compliance',
    enabled: true,
    configurable: true,
    defaultThreshold: 0.7,
    thresholds: {
      privacyScore: 0.7,
    },
  },
  
  // Output Guardrails
  {
    id: 'professional-tone',
    name: 'Professional Tone',
    description: 'Ensures agent responses maintain professional and appropriate tone',
    type: 'output',
    category: 'quality',
    enabled: true,
    configurable: true,
    defaultThreshold: 0.6,
    thresholds: {
      professionalScore: 0.6,
    },
  },
  
  {
    id: 'factual-accuracy',
    name: 'Factual Accuracy',
    description: 'Validates for factual correctness & appropriate uncertainty',
    type: 'output',
    category: 'quality',
    enabled: true,
    configurable: true,
    defaultThreshold: 0.7,
    thresholds: {
      accuracyScore: 0.7,
    },
  },
];

// Input guardrail factories registry
const INPUT_GUARDRAIL_FACTORIES: Record<string, InputGuardrailFactory> = {
  'content-safety': (config) => createContentSafetyGuardrail(config?.defaultThreshold),
  'privacy-protection': (config) => createPrivacyProtectionGuardrail(config?.defaultThreshold),
};

// Output guardrail factories registry
const OUTPUT_GUARDRAIL_FACTORIES: Record<string, OutputGuardrailFactory> = {
  'professional-tone': (config) => createProfessionalToneGuardrail(config?.defaultThreshold),
  'factual-accuracy': (config) => createFactualAccuracyGuardrail(config?.defaultThreshold),
};

/**
 * Get available guardrails by type
 */
export function getAvailableGuardrails(type?: 'input' | 'output'): GuardrailConfig[] {
  if (!type) {
    return AVAILABLE_GUARDRAILS.filter(g => g.enabled);
  }
  return AVAILABLE_GUARDRAILS.filter(g => g.enabled && g.type === type);
}

/**
 * Get guardrail configuration by ID
 */
export function getGuardrailConfig(id: string): GuardrailConfig | undefined {
  return AVAILABLE_GUARDRAILS.find(g => g.id === id);
}

/**
 * Create input guardrails from configuration
 */
export function getInputGuardrails(
  guardrailIds: string[] = [],
  thresholds?: Record<string, number>
): InputGuardrail[] {
  const guardrails: InputGuardrail[] = [];
  
  for (const id of guardrailIds) {
    const config = getGuardrailConfig(id);
    if (!config || config.type !== 'input') {
      console.warn(`Unknown or invalid input guardrail: ${id}`);
      continue;
    }
    
    const factory = INPUT_GUARDRAIL_FACTORIES[id];
    if (!factory) {
      console.warn(`No factory found for input guardrail: ${id}`);
      continue;
    }
    
    try {
      // Use custom threshold if provided, otherwise use default
      const threshold = thresholds?.[id] ?? config.defaultThreshold;
      const guardrail = factory({ ...config, defaultThreshold: threshold });
      guardrails.push(guardrail);
    } catch (error) {
      console.error(`Failed to create input guardrail ${id}:`, error);
    }
  }
  
  return guardrails;
}

/**
 * Create output guardrails from configuration
 */
export function getOutputGuardrails(
  guardrailIds: string[] = [],
  thresholds?: Record<string, number>
): OutputGuardrail[] {
  const guardrails: OutputGuardrail[] = [];
  
  for (const id of guardrailIds) {
    const config = getGuardrailConfig(id);
    if (!config || config.type !== 'output') {
      console.warn(`Unknown or invalid output guardrail: ${id}`);
      continue;
    }
    
    const factory = OUTPUT_GUARDRAIL_FACTORIES[id];
    if (!factory) {
      console.warn(`No factory found for output guardrail: ${id}`);
      continue;
    }
    
    try {
      // Use custom threshold if provided, otherwise use default
      const threshold = thresholds?.[id] ?? config.defaultThreshold;
      const guardrail = factory({ ...config, defaultThreshold: threshold });
      guardrails.push(guardrail);
    } catch (error) {
      console.error(`Failed to create output guardrail ${id}:`, error);
    }
  }
  
  return guardrails;
}

/**
 * Register a new input guardrail
 */
export function registerInputGuardrail(
  config: GuardrailConfig,
  factory: InputGuardrailFactory
): void {
  if (config.type !== 'input') {
    throw new Error('Config type must be "input" for input guardrails');
  }
  
  // Add to available guardrails
  const existingIndex = AVAILABLE_GUARDRAILS.findIndex(g => g.id === config.id);
  if (existingIndex >= 0) {
    AVAILABLE_GUARDRAILS[existingIndex] = config;
  } else {
    AVAILABLE_GUARDRAILS.push(config);
  }
  
  // Register factory
  INPUT_GUARDRAIL_FACTORIES[config.id] = factory;
}

/**
 * Register a new output guardrail
 */
export function registerOutputGuardrail(
  config: GuardrailConfig,
  factory: OutputGuardrailFactory
): void {
  if (config.type !== 'output') {
    throw new Error('Config type must be "output" for output guardrails');
  }
  
  // Add to available guardrails
  const existingIndex = AVAILABLE_GUARDRAILS.findIndex(g => g.id === config.id);
  if (existingIndex >= 0) {
    AVAILABLE_GUARDRAILS[existingIndex] = config;
  } else {
    AVAILABLE_GUARDRAILS.push(config);
  }
  
  // Register factory
  OUTPUT_GUARDRAIL_FACTORIES[config.id] = factory;
}

/**
 * Get guardrails statistics
 */
export function getGuardrailsStats(): {
  total: number;
  input: number;
  output: number;
  enabled: number;
  configurable: number;
  byCategory: Record<string, number>;
} {
  const enabled = AVAILABLE_GUARDRAILS.filter(g => g.enabled);
  const input = enabled.filter(g => g.type === 'input');
  const output = enabled.filter(g => g.type === 'output');
  const configurable = enabled.filter(g => g.configurable);
  
  const byCategory = enabled.reduce((acc, g) => {
    acc[g.category] = (acc[g.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total: AVAILABLE_GUARDRAILS.length,
    input: input.length,
    output: output.length,
    enabled: enabled.length,
    configurable: configurable.length,
    byCategory,
  };
}

/**
 * Validate guardrail configuration
 */
export function validateGuardrailConfiguration(
  inputGuardrails: string[],
  outputGuardrails: string[],
  thresholds?: Record<string, number>
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate input guardrails
  for (const id of inputGuardrails) {
    const config = getGuardrailConfig(id);
    if (!config) {
      errors.push(`Unknown guardrail: ${id}`);
      continue;
    }
    if (config.type !== 'input') {
      errors.push(`Guardrail ${id} is not an input guardrail`);
    }
    if (!config.enabled) {
      warnings.push(`Guardrail ${id} is disabled`);
    }
    if (!INPUT_GUARDRAIL_FACTORIES[id]) {
      errors.push(`No factory available for guardrail: ${id}`);
    }
  }
  
  // Validate output guardrails
  for (const id of outputGuardrails) {
    const config = getGuardrailConfig(id);
    if (!config) {
      errors.push(`Unknown guardrail: ${id}`);
      continue;
    }
    if (config.type !== 'output') {
      errors.push(`Guardrail ${id} is not an output guardrail`);
    }
    if (!config.enabled) {
      warnings.push(`Guardrail ${id} is disabled`);
    }
    if (!OUTPUT_GUARDRAIL_FACTORIES[id]) {
      errors.push(`No factory available for guardrail: ${id}`);
    }
  }
  
  // Validate thresholds
  if (thresholds) {
    for (const [id, threshold] of Object.entries(thresholds)) {
      if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
        errors.push(`Invalid threshold for ${id}: must be a number between 0 and 1`);
      }
      
      const config = getGuardrailConfig(id);
      if (config && !config.configurable) {
        warnings.push(`Guardrail ${id} is not configurable, threshold will be ignored`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}