import { BaseShopifyClient } from '../base';
import { ShopifyProduct, ListProductsParams } from '../../types';

export class ListProductsService extends BaseShopifyClient {
  /**
   * List products with optional filtering using GraphQL
   */
  async listProducts(params: ListProductsParams = {}): Promise<ShopifyProduct[]> {
    const query = `
      query products($first: Int, $query: String) {
        products(first: $first, query: $query) {
          edges {
            node {
              id
              title
              handle
              vendor
              productType
              description
              tags
              totalInventory
              onlineStoreUrl
              createdAt
              updatedAt
              publishedAt
              status
              collections(first: 5) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
                maxVariantPrice {
                  amount
                  currencyCode
                }
              }
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    price
                    compareAtPrice
                    sku
                    barcode
                    availableForSale
                    inventoryQuantity
                  }
                }
              }
              images(first: 3) {
                edges {
                  node {
                    id
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    `;

    const searchQuery = this.buildListQuery(params);
    const variables = {
      first: Math.min(params.limit || 50, 250),
      query: searchQuery
    };

    const result = await this.makeGraphQLRequest(query, variables);
    
    if (!result.data || !result.data.products) {
      throw new Error(`GraphQL response missing products data. Full response: ${JSON.stringify(result, null, 2)}`);
    }
    
    return this.transformProductsResponse(result.data.products as { edges: Array<{ node: Record<string, unknown> }> });
  }

  /**
   * Build GraphQL query string for listing products
   */
  private buildListQuery(params: ListProductsParams): string {
    const filters: string[] = [];
    
    // Filter by status if specified
    if (params.status && params.status !== 'all') {
      filters.push(`status:${params.status}`);
    }
    
    return filters.length > 0 ? filters.join(' AND ') : '';
  }

  /**
   * Transform GraphQL response to internal format
   */
  private transformProductsResponse(productsData: { edges: Array<{ node: Record<string, unknown> }> }): ShopifyProduct[] {
    return productsData.edges.map((edge) => {
      const node = edge.node;
      const variants = (node.variants as { edges: Array<{ node: Record<string, unknown> }> }).edges.map((variantEdge) => {
        const variant = variantEdge.node;
        const price = parseFloat(variant.price as string);
        const compareAtPrice = variant.compareAtPrice ? parseFloat(variant.compareAtPrice as string) : null;
        
        return {
          id: Number((variant.id as string).split('/').pop()),
          title: variant.title as string,
          price: variant.price as string,
          compareAtPrice: variant.compareAtPrice as string,
          sku: (variant.sku as string) || '',
          barcode: variant.barcode as string,
          availableForSale: variant.availableForSale as boolean,
          inventoryQuantity: (variant.inventoryQuantity as number) || 0,
          weight: 0, // Not available in GraphQL API
          weightUnit: 'kg', // Default value
          onSale: compareAtPrice ? price < compareAtPrice : false,
          salePercentage: compareAtPrice && price < compareAtPrice 
            ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
            : undefined,
          compare_at_price: variant.compareAtPrice as string,
          inventory_quantity: (variant.inventoryQuantity as number) || 0,
          available: variant.availableForSale as boolean,
          weight_unit: 'kg' // Default value
        };
      });

      const images = (node.images as { edges: Array<{ node: Record<string, unknown> }> }).edges.map((imageEdge) => ({
        id: Number((imageEdge.node.id as string).split('/').pop()),
        src: imageEdge.node.url as string,
        url: imageEdge.node.url as string,
        alt: imageEdge.node.altText as string,
        altText: imageEdge.node.altText as string
      }));

      const collections = (node.collections as { edges: Array<{ node: Record<string, unknown> }> }).edges.map((collectionEdge) => ({
        id: (collectionEdge.node.id as string).split('/').pop() || '',
        title: collectionEdge.node.title as string
      }));

      const hasOnSaleVariants = variants.some((v) => v.onSale);
      
      return {
        id: Number((node.id as string).split('/').pop()),
        title: node.title as string,
        handle: node.handle as string,
        vendor: node.vendor as string,
        product_type: node.productType as string,
        body_html: node.description as string,
        tags: (node.tags as string[]).join(','),
        variants,
        images,
        collections,
        priceRange: {
          min: (node.priceRangeV2 as { minVariantPrice: { amount: string } }).minVariantPrice.amount,
          max: (node.priceRangeV2 as { maxVariantPrice: { amount: string } }).maxVariantPrice.amount
        },
        onSale: hasOnSaleVariants,
        totalInventory: node.totalInventory as number,
        onlineStoreUrl: node.onlineStoreUrl as string,
        created_at: node.createdAt as string,
        updated_at: node.updatedAt as string,
        published_at: node.publishedAt as string,
        status: (node.status as string).toLowerCase(),
        options: [] // Not fetching options for list view for performance
      };
    });
  }
}