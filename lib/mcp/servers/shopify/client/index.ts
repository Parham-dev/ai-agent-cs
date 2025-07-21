import { MCPServerCredentials, SearchProductsParams, ListProductsParams, OrderTrackingParams } from '../types';
import { ProductsService } from './products/index';
import { InventoryService } from './inventory/index';
import { StoreService } from './store/index';
import { MarketingService } from './marketing/index';
import { CommerceService } from './commerce/index';
import { FulfillmentService } from './fulfillment/index';

/**
 * Main Shopify MCP client that composes all service domains
 */
export class ShopifyMCPClient {
  private products: ProductsService;
  private inventory: InventoryService;
  private store: StoreService;
  private marketing: MarketingService;
  private commerce: CommerceService;
  private fulfillment: FulfillmentService;

  constructor(credentials: MCPServerCredentials['credentials'], settings?: MCPServerCredentials['settings']) {
    // Initialize all service domains with the same credentials
    this.products = new ProductsService(credentials, settings);
    this.inventory = new InventoryService(credentials, settings);
    this.store = new StoreService(credentials, settings);
    this.marketing = new MarketingService(credentials, settings);
    this.commerce = new CommerceService(credentials, settings);
    this.fulfillment = new FulfillmentService(credentials, settings);
  }

  // Product methods
  async searchProducts(params: SearchProductsParams) {
    return this.products.searchProducts(params);
  }

  async getProductDetails(productId: string) {
    return this.products.getProductDetails(productId);
  }

  async listProducts(params: ListProductsParams = {}) {
    return this.products.listProducts(params);
  }

  // Inventory & Location methods
  async getLocations() {
    return this.inventory.getLocations();
  }

  async getInventoryLevels(locationId?: number, limit?: number) {
    return this.inventory.getInventoryLevels(locationId, limit);
  }

  async getInventoryItems(limit?: number) {
    return this.inventory.getInventoryItems(limit);
  }

  // Store content methods
  async getPolicies() {
    return this.store.getPolicies();
  }

  async getPages(limit?: number) {
    return this.store.getPages(limit);
  }

  async getLocales() {
    return this.store.getLocales();
  }

  // Marketing methods
  async getMarketingEvents(limit?: number) {
    return this.marketing.getMarketingEvents(limit);
  }

  // Commerce methods
  async getPaymentTerms(limit?: number) {
    return this.commerce.getPaymentTerms(limit);
  }

  async getProductListings(limit?: number) {
    return this.commerce.getProductListings(limit);
  }

  async getShippingZones() {
    return this.commerce.getShippingZones();
  }

  // Fulfillment methods
  async getOrderTracking(params: OrderTrackingParams) {
    return this.fulfillment.getOrderTracking(params);
  }

  // Common methods (delegate to products service for now)
  async validateCredentials() {
    return this.products.validateCredentials();
  }

  async healthCheck() {
    return this.products.healthCheck();
  }

  getStats() {
    return this.products.getStats();
  }
}

// Re-export for backward compatibility
export { ProductsService, InventoryService, StoreService, MarketingService, CommerceService, FulfillmentService };