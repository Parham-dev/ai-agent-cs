import { BaseShopifyClient } from './base';
import { ShopifyPaymentTerm, ShopifyProductListing, ShopifyShippingZone } from '../types';

/**
 * Commerce and business logic-related Shopify API methods
 */
export class CommerceService extends BaseShopifyClient {
  /**
   * Get payment terms
   */
  async getPaymentTerms(limit: number = 50): Promise<ShopifyPaymentTerm[]> {
    const endpoint = `/payment_terms.json?limit=${Math.min(limit, 250)}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch payment terms. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.payment_terms || [];
  }

  /**
   * Get product listings (for online store)
   */
  async getProductListings(limit: number = 50): Promise<ShopifyProductListing[]> {
    const endpoint = `/product_listings.json?limit=${Math.min(limit, 250)}`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch product listings. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.product_listings || [];
  }

  /**
   * Get shipping zones
   */
  async getShippingZones(): Promise<ShopifyShippingZone[]> {
    const endpoint = `/shipping_zones.json`;
    
    const response = await this.makeRequest(endpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch shipping zones. Status: ${response.status}`);
    }

    const data = await response.json();
    return data.shipping_zones || [];
  }
}