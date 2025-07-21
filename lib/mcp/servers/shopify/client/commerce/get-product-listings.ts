import { BaseShopifyClient } from '../base';
import { ShopifyProductListing } from '../../types';

export class GetProductListingsService extends BaseShopifyClient {
  /**
   * Get product listings for online store (published products only) using GraphQL
   */
  async getProductListings(limit: number = 50): Promise<ShopifyProductListing[]> {
    const query = `
      query getPublishedProducts($first: Int) {
        products(first: $first, query: "status:ACTIVE") {
          edges {
            node {
              id
              title
              handle
              vendor
              productType
              descriptionHtml
              tags
              status
              publishedAt
              createdAt
              updatedAt
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      first: Math.min(limit, 250)
    };

    const result = await this.makeGraphQLRequest(query, variables);
    
    if (!result.data || !result.data.products) {
      return [];
    }

    // Transform GraphQL response to match ShopifyProductListing format
    // Filter to only include products that are published (have publishedAt date)
    return (result.data.products as { edges: Array<{ node: Record<string, unknown> }> }).edges
      .filter(edge => edge.node.publishedAt != null)
      .map(edge => {
      const product = edge.node;
      const productId = (product.id as string).split('/').pop() || '0';
      
      return {
        product_id: parseInt(productId, 10),
        created_at: product.createdAt as string,
        updated_at: product.updatedAt as string,
        body_html: product.descriptionHtml as string || '',
        handle: product.handle as string,
        product_type: product.productType as string || '',
        title: product.title as string,
        vendor: product.vendor as string || '',
        available: product.status === 'ACTIVE',
        tags: Array.isArray(product.tags) ? (product.tags as string[]).join(', ') : '',
        published_at: product.publishedAt as string || product.createdAt as string,
        variants: this.transformVariants(product.variants as { edges: Array<{ node: Record<string, unknown> }> })
      };
    });
  }

  private transformVariants(variantsData: { edges: Array<{ node: Record<string, unknown> }> }): ShopifyProductListing['variants'] {
    return variantsData.edges.map(edge => {
      const variant = edge.node;
      const variantId = (variant.id as string).split('/').pop() || '0';
      const selectedOptions = variant.selectedOptions as Array<{ name: string; value: string }> || [];
      
      return {
        id: parseInt(variantId, 10),
        title: variant.title as string || '',
        option_values: selectedOptions.map(opt => ({
          option_id: 0, // Not available in GraphQL
          name: opt.name,
          value: opt.value
        })),
        available: variant.availableForSale as boolean || false
      };
    });
  }
}