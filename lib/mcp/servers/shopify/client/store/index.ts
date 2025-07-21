import { GetPoliciesService } from './get-policies';
import { GetPagesService } from './get-pages';
import { GetLocalesService } from './get-locales';
import { MCPServerCredentials, ShopifyPage, ShopifyLocale } from '../../types';

/**
 * Main Store service that composes all store-related operations
 */
export class StoreService extends GetPoliciesService {
  private getPagesService: GetPagesService;
  private getLocalesService: GetLocalesService;

  constructor(credentials: MCPServerCredentials['credentials'], settings?: MCPServerCredentials['settings']) {
    super(credentials, settings);
    this.getPagesService = new GetPagesService(credentials, settings);
    this.getLocalesService = new GetLocalesService(credentials, settings);
  }

  /**
   * Get store policies (inherited from GetPoliciesService)
   */
  // getPolicies method is inherited

  /**
   * Get online store pages
   */
  async getPages(limit?: number): Promise<ShopifyPage[]> {
    return this.getPagesService.getPages(limit);
  }

  /**
   * Get available locales
   */
  async getLocales(): Promise<ShopifyLocale[]> {
    return this.getLocalesService.getLocales();
  }
}