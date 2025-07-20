/**
 * Models API Client - handles AI model related operations
 */

import { BaseApiClient } from '../base/client';

export interface AIModel {
  value: string;
  label: string;
  description: string;
  pricing: {
    input: number;
    output: number;
  } | null;
}

export class ModelsApiClient extends BaseApiClient {
  /**
   * Get available AI models
   */
  async getModels(): Promise<AIModel[]> {
    return this.request<AIModel[]>('/models');
  }
}