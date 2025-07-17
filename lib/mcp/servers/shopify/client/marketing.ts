import { BaseShopifyClient } from './base';
import { ShopifyMarketingEvent } from '../types';

/**
 * Marketing-related Shopify API methods
 */
export class MarketingService extends BaseShopifyClient {
  /**
   * Get marketing events
   */
  async getMarketingEvents(limit: number = 50): Promise<ShopifyMarketingEvent[]> {
    const endpoint = `/marketing_events.json?limit=${Math.min(limit, 250)}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch marketing events. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.marketing_events || [];
  }
}