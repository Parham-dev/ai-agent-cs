import { GetShippingZonesService, DeliveryProfile } from './get-shipping-zones';
import { GetPaymentTermsService } from './get-payment-terms';
import { GetProductListingsService } from './get-product-listings';
import { MCPServerCredentials, ShopifyPaymentTerm, ShopifyProductListing } from '../../types';

/**
 * Main Commerce service that composes all commerce-related operations
 */
export class CommerceService extends GetShippingZonesService {
  private getPaymentTermsService: GetPaymentTermsService;
  private getProductListingsService: GetProductListingsService;

  constructor(credentials: MCPServerCredentials['credentials'], settings?: MCPServerCredentials['settings']) {
    super(credentials, settings);
    this.getPaymentTermsService = new GetPaymentTermsService(credentials, settings);
    this.getProductListingsService = new GetProductListingsService(credentials, settings);
  }

  /**
   * Get shipping zones and delivery profiles (inherited from GetShippingZonesService)
   */
  // getShippingZones method is inherited

  /**
   * Get payment terms
   */
  async getPaymentTerms(limit: number = 50): Promise<ShopifyPaymentTerm[]> {
    return this.getPaymentTermsService.getPaymentTerms(limit);
  }

  /**
   * Get product listings for online store
   */
  async getProductListings(limit: number = 50): Promise<ShopifyProductListing[]> {
    return this.getProductListingsService.getProductListings(limit);
  }
}

// Re-export types
export type { DeliveryProfile };