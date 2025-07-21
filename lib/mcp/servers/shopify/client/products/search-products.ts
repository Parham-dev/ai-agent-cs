import { BaseShopifyClient } from '../base';
import { ShopifyProduct, SearchProductsParams } from '../../types';

export class SearchProductsService extends BaseShopifyClient {
  /**
   * Search products using GraphQL
   */
  async searchProducts(params: SearchProductsParams): Promise<ShopifyProduct[]> {
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
              variants(first: 10) {
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
              images(first: 5) {
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

    const searchQuery = this.buildSearchQuery(params);
    const variables = {
      first: Math.min(params.limit || 10, 50),
      query: searchQuery
    };

    const result = await this.makeGraphQLRequest(query, variables);
    
    if (!result.data || !result.data.products) {
      throw new Error(`GraphQL response missing products data. Full response: ${JSON.stringify(result, null, 2)}`);
    }
    
    return this.transformProductsResponse(result.data.products as { edges: Array<{ node: Record<string, unknown> }> });
  }

  /**
   * Build GraphQL search query string from parameters
   */
  private buildSearchQuery(params: SearchProductsParams): string {
    const filters: string[] = [];
    
    // Only show active products for customers (hide status from them)
    filters.push('status:active');
    
    if (params.query) {
      filters.push(`title:*${params.query}*`);
    }
    
    if (params.vendor) {
      filters.push(`vendor:${params.vendor}`);
    }
    
    if (params.productType) {
      filters.push(`product_type:${params.productType}`);
    }
    
    if (params.tags && params.tags.length > 0) {
      const tagQuery = params.tags.map(tag => `tag:${tag}`).join(' OR ');
      filters.push(`(${tagQuery})`);
    }
    
    if (params.sku) {
      filters.push(`sku:${params.sku}`);
    }
    
    if (params.barcode) {
      filters.push(`barcode:${params.barcode}`);
    }
    
    if (params.priceMin !== undefined) {
      filters.push(`variants.price:>=${params.priceMin}`);
    }
    
    if (params.priceMax !== undefined) {
      filters.push(`variants.price:<=${params.priceMax}`);
    }
    
    if (params.inStockOnly) {
      filters.push('variants.inventory_quantity:>0');
    }
    
    if (params.onSaleOnly) {
      filters.push('variants.compare_at_price:>0');
    }
    
    if (params.collectionId) {
      filters.push(`collection_id:${params.collectionId}`);
    }
    
    return filters.join(' AND ');
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
        created_at: '',
        updated_at: '',
        published_at: '',
        status: 'active',
        options: []
      };
    });
  }
}