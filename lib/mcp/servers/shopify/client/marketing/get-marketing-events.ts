import { BaseShopifyClient } from '../base';
import { ShopifyMarketingEvent } from '../../types';

export class GetMarketingEventsService extends BaseShopifyClient {
  /**
   * Get marketing events - optimized for customer service context
   * Only returns active/recent events that might be relevant for customer interactions
   */
  async getMarketingEvents(limit: number = 50): Promise<ShopifyMarketingEvent[]> {
    // For customer service, we mainly care about:
    // 1. Active campaigns (currently running)
    // 2. Recent campaigns (last 30 days) that customers might reference
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
    
    // Note: REST API is deprecated, but marketing events don't seem to have a direct GraphQL equivalent
    // This is acceptable as marketing events are low-priority for customer service
    const endpoint = `/marketing_events.json?limit=${Math.min(limit, 50)}&started_at_min=${thirtyDaysAgoISO}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      // If marketing events fail, return empty array - not critical for customer service
      return [];
    }

    const data = await response.json();
    const events = data.marketing_events || [];
    
    // Filter to only include events that are relevant for customer service:
    // - Currently active events
    // - Recent events that customers might ask about
    return events
      .filter(this.isRelevantForCustomerService)
      .slice(0, limit);
  }

  /**
   * Determine if a marketing event is relevant for customer service
   */
  private isRelevantForCustomerService(event: ShopifyMarketingEvent): boolean {
    const now = new Date();
    const startedAt = new Date(event.started_at);
    const endedAt = event.ended_at ? new Date(event.ended_at) : null;
    
    // Include if:
    // 1. Currently active (started and not ended, or ended in future)
    // 2. Recent (started within last 30 days) - customers might reference it
    const isActive = startedAt <= now && (!endedAt || endedAt > now);
    const isRecent = (now.getTime() - startedAt.getTime()) <= (30 * 24 * 60 * 60 * 1000); // 30 days
    
    return isActive || isRecent;
  }
}