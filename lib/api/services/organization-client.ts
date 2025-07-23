/**
 * Organization API Client - handles organization settings and preferences
 */

import { BaseApiClient } from '../base/client';

export interface BillingData {
  credits: {
    available: number;
    freeCredits: number;
    paidCredits: number;
    usedCredits: number;
    formattedBalance: string;
    formattedBalanceInCents: string;
    // Add alias for backward compatibility
    credits?: number;
  };
  currentMonth: {
    totalSystemCost: number;
    totalUserCost: number;
    totalTokens: number;
    conversations: number;
    formattedCost: string;
  };
  lastMonth: {
    totalSystemCost: number;
    totalUserCost: number;
    totalTokens: number;
    conversations: number;
    formattedCost: string;
  };
  budget: {
    isWithinBudget: boolean;
    currentSpend: number;
    monthlyBudget: number;
    alertThreshold: number;
    shouldAlert: boolean;
    percentageUsed: number | null;
  };
  topModels: Array<{
    model: string;
    count: number;
    cost: number;
    userCost: number;
    formattedCost: string;
  }>;
  recentTrend: Array<{
    date: string;
    cost: number;
    userCost: number;
    formattedCost: string;
  }>;
  pricing: {
    marginPercentage: number;
    description: string;
  };
}

export interface UsageRecord {
  id: string;
  createdAt: string;
  model: string;
  source: string;
  totalTokens: number;
  userCost: number;
}

export interface Transaction {
  id: string;
  createdAt: string;
  type: string;
  amount: number;
  description?: string;
}

export interface AddCreditsResponse {
  success: boolean;
  newBalance: number;
  message: string;
}

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

  /**
   * Get billing information
   */
  async getBilling(): Promise<BillingData> {
    return this.request<BillingData>('/organization/billing');
  }

  /**
   * Get usage data
   */
  async getUsage(limit: number = 50): Promise<{ usage: UsageRecord[] }> {
    return this.request<{ usage: UsageRecord[] }>(`/organization/usage?limit=${limit}`);
  }

  /**
   * Get transaction history
   */
  async getTransactions(limit: number = 50): Promise<{ transactions: Transaction[] }> {
    return this.request<{ transactions: Transaction[] }>(`/organization/transactions?limit=${limit}`);
  }

  /**
   * Add credits to organization
   */
  async addCredits(amount: number): Promise<AddCreditsResponse> {
    return this.request<AddCreditsResponse>('/organization/credits', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }
}