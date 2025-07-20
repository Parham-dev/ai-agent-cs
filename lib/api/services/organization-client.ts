/**
 * Organization API Client - handles organization settings and preferences
 */

import { BaseApiClient } from '../base/client';

export interface OrganizationSettings {
  // Default model preferences
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  
  // Default agent settings
  defaultInstructions: string;
  
  // Organization limits/constraints
  allowedModels: string[];
  maxTokenLimit: number;
  temperatureRange: { min: number; max: number };
  
  // UI preferences
  showAdvancedOptions: boolean;
  enableCustomInstructions: boolean;
  defaultOutputType: 'text' | 'json';
  defaultToolChoice: 'auto' | 'required' | 'none';
  
  // Organization metadata
  organizationId: string;
  organizationName: string;
}

export class OrganizationApiClient extends BaseApiClient {
  /**
   * Get organization settings for agent creation
   */
  async getSettings(): Promise<OrganizationSettings> {
    return this.request<OrganizationSettings>('/organization/settings');
  }
}