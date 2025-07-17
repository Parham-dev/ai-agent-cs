import { BaseShopifyClient } from './base';
import { ShopifyLocation, ShopifyInventoryLevel, ShopifyInventoryItem } from '../types';

/**
 * Inventory and location-related Shopify API methods
 */
export class InventoryService extends BaseShopifyClient {
  /**
   * Get store locations
   */
  async getLocations(): Promise<ShopifyLocation[]> {
    const endpoint = `/locations.json`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch locations. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.locations || [];
  }

  /**
   * Get inventory levels for a location
   */
  async getInventoryLevels(locationId?: number, limit: number = 50): Promise<ShopifyInventoryLevel[]> {
    let endpoint = `/inventory_levels.json?limit=${Math.min(limit, 250)}`;
    
    if (locationId) {
      endpoint += `&location_ids=${locationId}`;
    }
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory levels. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.inventory_levels || [];
  }

  /**
   * Get inventory items
   */
  async getInventoryItems(limit: number = 50): Promise<ShopifyInventoryItem[]> {
    const endpoint = `/inventory_items.json?limit=${Math.min(limit, 250)}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory items. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.inventory_items || [];
  }
}