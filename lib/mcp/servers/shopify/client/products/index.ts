import { SearchProductsService } from './search-products';
import { GetProductDetailsService } from './get-product-details';
import { ListProductsService } from './list-products';
import { MCPServerCredentials, ListProductsParams, ShopifyProduct } from '../../types';

/**
 * Main Products service that composes all product-related operations
 */
export class ProductsService extends SearchProductsService {
  private getProductDetailsService: GetProductDetailsService;
  private listProductsService: ListProductsService;

  constructor(credentials: MCPServerCredentials['credentials'], settings?: MCPServerCredentials['settings']) {
    super(credentials, settings);
    this.getProductDetailsService = new GetProductDetailsService(credentials, settings);
    this.listProductsService = new ListProductsService(credentials, settings);
  }

  /**
   * Search products with advanced filtering (inherited from SearchProductsService)
   */
  // searchProducts method is inherited from SearchProductsService

  /**
   * Get detailed information about a specific product
   */
  async getProductDetails(productId: string): Promise<ShopifyProduct | null> {
    return this.getProductDetailsService.getProductDetails(productId);
  }

  /**
   * List products with optional filtering
   */
  async listProducts(params: ListProductsParams = {}): Promise<ShopifyProduct[]> {
    return this.listProductsService.listProducts(params);
  }
}