import { BaseShopifyClient } from './base';
import { ShopifyPolicy, ShopifyPage, ShopifyLocale } from '../types';

/**
 * Store content and settings-related Shopify API methods
 */
export class StoreService extends BaseShopifyClient {
  /**
   * Get store policies (legal policies)
   */
  async getPolicies(): Promise<ShopifyPolicy[]> {
    const endpoint = `/policies.json`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch policies. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.policies || [];
  }

  /**
   * Get online store pages
   */
  async getPages(limit: number = 50): Promise<ShopifyPage[]> {
    const endpoint = `/pages.json?limit=${Math.min(limit, 250)}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch pages. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.pages || [];
  }

  /**
   * Get available locales
   */
  async getLocales(): Promise<ShopifyLocale[]> {
    const endpoint = `/locales.json`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch locales. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.locales || [];
  }
}