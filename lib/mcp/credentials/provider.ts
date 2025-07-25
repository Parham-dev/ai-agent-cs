import { logger } from '@/lib/utils/logger';

/**
 * Credential Provider Interface
 * Simplified, extensible credential management system
 */

export interface CredentialProvider<T = Record<string, unknown>> {
  getCredentials(context?: unknown): Promise<T | null>;
  validateCredentials(credentials: T): boolean;
  type: string;
}

/**
 * Base implementation for credential providers
 */
export abstract class BaseCredentialProvider<T = Record<string, unknown>> implements CredentialProvider<T> {
  constructor(public readonly type: string) {}
  
  abstract getCredentials(context?: unknown): Promise<T | null>;
  
  validateCredentials(credentials: T): boolean {
    return credentials !== null && typeof credentials === 'object';
  }
}

/**
 * Environment variable credential provider
 */
export class EnvCredentialProvider<T = Record<string, unknown>> extends BaseCredentialProvider<T> {
  constructor(
    type: string,
    private envMapping: Record<keyof T, string>
  ) {
    super(type);
  }

  async getCredentials(): Promise<T | null> {
    const credentials = {} as T;
    let hasAllKeys = true;

    for (const [key, envVar] of Object.entries(this.envMapping)) {
      const value = process.env[envVar];
      if (!value) {
        logger.warn(`Missing environment variable: ${envVar}`);
        hasAllKeys = false;
      } else {
        (credentials as any)[key] = value;
      }
    }

    return hasAllKeys ? credentials : null;
  }

  validateCredentials(credentials: T): boolean {
    if (!super.validateCredentials(credentials)) return false;
    
    for (const key of Object.keys(this.envMapping)) {
      if (!(key in credentials)) return false;
    }
    
    return true;
  }
}

/**
 * Request header credential provider
 */
export class HeaderCredentialProvider<T = Record<string, unknown>> extends BaseCredentialProvider<T> {
  constructor(
    type: string,
    private headerMapping: Record<keyof T, string>
  ) {
    super(type);
  }

  async getCredentials(context?: unknown): Promise<T | null> {
    if (!context || typeof context !== 'object' || !('headers' in context)) {
      return null;
    }

    const request = context as Request;
    const credentials = {} as T;
    let hasAllKeys = true;

    for (const [key, headerName] of Object.entries(this.headerMapping)) {
      const value = request.headers.get(headerName);
      if (!value) {
        hasAllKeys = false;
      } else {
        (credentials as any)[key] = value;
      }
    }

    return hasAllKeys ? credentials : null;
  }
}

/**
 * Composite credential provider that tries multiple providers in order
 */
export class CompositeCredentialProvider<T = Record<string, unknown>> extends BaseCredentialProvider<T> {
  constructor(
    type: string,
    private providers: CredentialProvider<T>[]
  ) {
    super(type);
  }

  async getCredentials(context?: unknown): Promise<T | null> {
    for (const provider of this.providers) {
      try {
        const credentials = await provider.getCredentials(context);
        if (credentials && provider.validateCredentials(credentials)) {
          logger.info(`Retrieved credentials from ${provider.type} provider`);
          return credentials;
        }
      } catch (error) {
        logger.warn(`Failed to get credentials from ${provider.type}`, { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
    return null;
  }
}