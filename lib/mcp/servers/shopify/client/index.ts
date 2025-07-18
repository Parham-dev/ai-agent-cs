import { MCPServerCredentials } from '../types';
import { ProductsService } from './products';
import { InventoryService } from './inventory';
import { StoreService } from './store';
import { MarketingService } from './marketing';
import { CommerceService } from './commerce';

/**
 * Main Shopify MCP client that composes all service domains
 */
export class ShopifyMCPClient {
  private products: ProductsService;
  private inventory: InventoryService;
  private store: StoreService;
  private marketing: MarketingService;
  private commerce: CommerceService;

  constructor(credentials: MCPServerCredentials['credentials'], settings?: MCPServerCredentials['settings']) {
    // Initialize all service domains with the same credentials
    this.products = new ProductsService(credentials, settings);
    this.inventory = new InventoryService(credentials, settings);
    this.store = new StoreService(credentials, settings);
    this.marketing = new MarketingService(credentials, settings);
    this.commerce = new CommerceService(credentials, settings);
  }

  // Product methods
  async searchProducts(query: string, limit?: number) {
    return this.products.searchProducts(query, limit);
  }

  async getProductDetails(productId: string) {
    return this.products.getProductDetails(productId);
  }

  async listProducts(limit?: number, status?: string) {
    return this.products.listProducts(limit, status);
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
export { ProductsService, InventoryService, StoreService, MarketingService, CommerceService };