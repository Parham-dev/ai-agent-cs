import { logger } from '@/lib/utils/logger';

/**
 * MCP Tool Registry
 * Centralized tool management with auto-discovery capabilities
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (params: any, context: any) => Promise<any>;
  metadata?: {
    category?: string;
    complexity?: string;
    requiresAuth?: boolean;
  };
}

export interface ToolRegistryOptions {
  validateOnRegister?: boolean;
  allowOverrides?: boolean;
}

/**
 * Tool Registry Class
 */
export class ToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private options: ToolRegistryOptions;

  constructor(options: ToolRegistryOptions = {}) {
    this.options = {
      validateOnRegister: true,
      allowOverrides: false,
      ...options
    };
  }

  /**
   * Register a single tool
   */
  register(tool: MCPTool): void {
    if (this.options.validateOnRegister) {
      const errors = this.validateTool(tool);
      if (errors.length > 0) {
        throw new Error(`Tool validation failed: ${errors.join(', ')}`);
      }
    }

    if (this.tools.has(tool.name) && !this.options.allowOverrides) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }

    this.tools.set(tool.name, tool);
    logger.debug('Registered tool', { 
      name: tool.name, 
      category: tool.metadata?.category 
    });
  }

  /**
   * Register multiple tools
   */
  registerMany(tools: MCPTool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /**
   * Get a tool by name
   */
  get(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools
   */
  getAll(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): MCPTool[] {
    return this.getAll().filter(tool => tool.metadata?.category === category);
  }

  /**
   * Get tool names
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Remove a tool
   */
  remove(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * Validate a tool
   */
  validateTool(tool: MCPTool): string[] {
    const errors: string[] = [];

    if (!tool.name || typeof tool.name !== 'string') {
      errors.push('Tool must have a valid name');
    }

    if (!tool.description || typeof tool.description !== 'string') {
      errors.push('Tool must have a valid description');
    }

    if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
      errors.push('Tool must have a valid inputSchema');
    }

    if (!tool.handler || typeof tool.handler !== 'function') {
      errors.push('Tool must have a valid handler function');
    }

    return errors;
  }

  /**
   * Filter tools by predicate
   */
  filter(predicate: (tool: MCPTool) => boolean): MCPTool[] {
    return this.getAll().filter(predicate);
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    byCategory: Record<string, number>;
    requiresAuth: number;
  } {
    const tools = this.getAll();
    const byCategory: Record<string, number> = {};
    let requiresAuth = 0;

    for (const tool of tools) {
      const category = tool.metadata?.category || 'uncategorized';
      byCategory[category] = (byCategory[category] || 0) + 1;
      
      if (tool.metadata?.requiresAuth) {
        requiresAuth++;
      }
    }

    return {
      total: tools.length,
      byCategory,
      requiresAuth
    };
  }
}

/**
 * Global tool registry instance
 */
export const globalToolRegistry = new ToolRegistry();

/**
 * Tool decorator for auto-registration (TypeScript experimental)
 */
export function RegisterTool(metadata?: MCPTool['metadata']) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const tool: MCPTool = {
      name: propertyKey,
      description: target[`${propertyKey}_description`] || propertyKey,
      inputSchema: target[`${propertyKey}_schema`] || {},
      handler: descriptor.value,
      metadata
    };
    
    globalToolRegistry.register(tool);
    return descriptor;
  };
}

/**
 * Create a tool from a simple function
 */
export function createTool(
  name: string,
  description: string,
  inputSchema: Record<string, unknown>,
  handler: (params: any, context: any) => Promise<any>,
  metadata?: MCPTool['metadata']
): MCPTool {
  return {
    name,
    description,
    inputSchema,
    handler,
    metadata
  };
}

/**
 * Load tools from a module (auto-discovery)
 */
export async function loadToolsFromModule(modulePath: string): Promise<MCPTool[]> {
  try {
    const module = await import(modulePath);
    const tools: MCPTool[] = [];

    for (const [key, value] of Object.entries(module)) {
      if (key.endsWith('Tool') && typeof value === 'object' && value !== null) {
        const tool = value as any;
        if (tool.name && tool.handler && tool.description && tool.inputSchema) {
          tools.push(tool as MCPTool);
        }
      }
    }

    return tools;
  } catch (error) {
    logger.error('Failed to load tools from module', { 
      modulePath,
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }
}