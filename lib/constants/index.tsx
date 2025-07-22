/**
 * Centralized constants for the application
 * This file consolidates all constants used across the application for better maintainability
 */

import { Bot, Sparkles, Settings, Brain } from 'lucide-react'
import { costCalculatorService } from '../services/cost-calculator.service'

// =============================================================================
// AI MODEL CONSTANTS
// =============================================================================

/**
 * Available AI models for agent creation
 * Dynamically loaded from cost calculator service to ensure consistency
 */
export const AI_MODELS = costCalculatorService.getAvailableModels().map(model => ({
  value: model.value,
  label: model.label,
  description: model.description
}))

/**
 * Default AI model for new agents
 */
export const DEFAULT_AI_MODEL = 'gpt-4o-mini'

// =============================================================================
// INTEGRATION CONSTANTS
// =============================================================================

/**
 * Available integration types
 * Centralized list of all supported integrations
 */
export const AVAILABLE_INTEGRATIONS: ('shopify' | 'stripe' | 'custom-mcp')[] = ['shopify', 'stripe', 'custom-mcp']

/**
 * Integration display names mapping
 */
export const INTEGRATION_DISPLAY_NAMES: Record<string, string> = {
  shopify: 'Shopify',
  stripe: 'Stripe',
  'custom-mcp': 'Custom MCP Server',
}

/**
 * Integration descriptions mapping
 */
export const INTEGRATION_DESCRIPTIONS: Record<string, string> = {
  shopify: 'E-commerce platform integration for product and order management',
  stripe: 'Payment processing integration for transactions and billing',
  'custom-mcp': 'Connect to any Model Context Protocol (MCP) server for custom tools and capabilities',
}

// =============================================================================
// AGENT BEHAVIOR CONSTANTS
// =============================================================================

/**
 * Output type options for agent responses
 */
export const OUTPUT_TYPE_OPTIONS = [
  { value: 'text', label: 'Text Response' },
  { value: 'structured', label: 'Structured Data' }
]

/**
 * Tool choice options for agent behavior
 */
export const TOOL_CHOICE_OPTIONS = [
  { value: 'auto', label: 'Auto (Recommended)' },
  { value: 'required', label: 'Always Use Tools' },
  { value: 'none', label: 'Never Use Tools' }
]

// =============================================================================
// INSTRUCTION TEMPLATES
// =============================================================================

/**
 * Pre-defined instruction templates for different agent types
 */
export const INSTRUCTION_TEMPLATES = {
  'customer-support': {
    title: 'Customer Support Agent',
    description: 'Friendly and helpful customer service agent',
    icon: <Bot className="w-5 h-5" />,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg',
    borderColor: 'border-blue-500/20 bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/20 dark:to-blue-800/20',
    instructions: `You are a helpful customer service agent for our company. Your role is to:

- Assist customers with product information and recommendations
- Help resolve issues with orders, shipping, and returns
- Provide accurate information about policies and procedures
- Escalate complex issues to human agents when necessary
- Always maintain a friendly, professional, and empathetic tone

Guidelines:
- Be patient and understanding with frustrated customers
- Ask clarifying questions to better understand their needs
- Provide step-by-step solutions when possible
- Always verify customer information before accessing sensitive data`
  },
  'sales-agent': {
    title: 'Sales Agent',
    description: 'Persuasive sales assistant focused on conversions',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg',
    borderColor: 'border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 dark:from-emerald-900/20 dark:to-emerald-800/20',
    instructions: `You are a knowledgeable sales agent focused on helping customers find the right products. Your objectives:

- Understand customer needs and preferences through thoughtful questions
- Recommend products that genuinely match their requirements
- Highlight key benefits and value propositions
- Address objections with facts and social proof
- Guide customers towards making informed purchase decisions

Best Practices:
- Listen more than you speak
- Build trust through expertise and honesty
- Use consultative selling techniques
- Create urgency only when genuinely appropriate
- Always prioritize customer satisfaction over quick sales`
  },
  'technical-support': {
    title: 'Technical Support Agent',
    description: 'Expert technical troubleshooting assistant',
    icon: <Settings className="w-5 h-5" />,
    color: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg',
    borderColor: 'border-purple-500/20 bg-gradient-to-br from-purple-50/80 to-purple-100/80 dark:from-purple-900/20 dark:to-purple-800/20',
    instructions: `You are a technical support specialist with deep product knowledge. Your responsibilities:

- Diagnose technical issues through systematic troubleshooting
- Provide clear, step-by-step resolution instructions
- Explain complex technical concepts in simple terms
- Document solutions for future reference
- Know when to escalate to engineering teams

Technical Approach:
- Start with the most common solutions first
- Gather comprehensive information about the issue
- Verify each step before moving to the next
- Use screenshots or diagrams when helpful
- Always test the solution with the customer`
  },
  'general-assistant': {
    title: 'General Assistant',
    description: 'Versatile AI assistant for various tasks',
    icon: <Brain className="w-5 h-5" />,
    color: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg',
    borderColor: 'border-orange-500/20 bg-gradient-to-br from-orange-50/80 to-orange-100/80 dark:from-orange-900/20 dark:to-orange-800/20',
    instructions: `You are a versatile AI assistant designed to help with a wide range of tasks. Your capabilities include:

- Answering questions on various topics
- Providing helpful explanations and guidance
- Assisting with research and information gathering
- Helping with problem-solving and decision-making
- Offering creative ideas and suggestions

Core Principles:
- Be accurate and cite sources when possible
- Admit when you don't know something
- Offer to help find additional resources
- Maintain a helpful and professional demeanor
- Respect privacy and confidentiality`
  }
}

// =============================================================================
// WIZARD CONSTANTS
// =============================================================================

/**
 * Form limits for agent creation
 */
export const FORM_LIMITS = {
  name: { min: 3, max: 50 },
  description: { min: 10, max: 200 },
  systemPrompt: { min: 20, max: 5000 },
  temperature: { min: 0, max: 2, step: 0.1 },
  maxTokens: { min: 100, max: 8000, step: 100 },
  customInstructions: { max: 10 }
}

/**
 * Step validation rules for wizard
 */
export const STEP_VALIDATION_RULES = {
  basicInfo: ['name', 'systemPrompt', 'model'],
  integrations: [], // Optional step
  tools: [], // Optional step
  advanced: [], // Optional step
  review: [], // No additional validation needed
} as const

// =============================================================================
// COST TRACKING CONSTANTS
// =============================================================================

/**
 * Default billing configuration values
 */
export const DEFAULT_BILLING_CONFIG = {
  monthlyBudget: null,
  alertThreshold: 0.8,
  maxCostPerMessage: null,
  emailAlerts: true,
  alertEmail: null,
  autoOptimize: false,
  preferredModel: DEFAULT_AI_MODEL
}

/**
 * Cost alert thresholds
 */
export const COST_ALERT_THRESHOLDS = [
  { value: 0.5, label: '50%' },
  { value: 0.7, label: '70%' },
  { value: 0.8, label: '80%' },
  { value: 0.9, label: '90%' },
  { value: 0.95, label: '95%' }
]

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type AvailableIntegrationType = typeof AVAILABLE_INTEGRATIONS[number]
export type InstructionTemplateType = keyof typeof INSTRUCTION_TEMPLATES
export type OutputType = typeof OUTPUT_TYPE_OPTIONS[number]['value']
export type ToolChoiceType = typeof TOOL_CHOICE_OPTIONS[number]['value']
