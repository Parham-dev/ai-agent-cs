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
              images(first: 10) {
                edges {
                  node {
                    id
                    url
                    altText
                  }
                }
              }
              options {
                id
                name
                values
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    price
                    compareAtPrice
                    sku
                    barcode
                    inventoryQuantity
                    inventoryPolicy
                    position
                    createdAt
                    updatedAt
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
        body_html: this.truncateDescription(product.descriptionHtml as string || ''),
        handle: product.handle as string,
        product_type: product.productType as string || '',
        title: product.title as string,
        vendor: product.vendor as string || '',
        available: product.status === 'ACTIVE',
        tags: Array.isArray(product.tags) ? (product.tags as string[]).join(', ') : '',
        published_at: product.publishedAt as string || product.createdAt as string,
        variants: this.transformVariants(product.variants as { edges: Array<{ node: Record<string, unknown> }> }),
        images: this.transformImages(product.images as { edges: Array<{ node: Record<string, unknown> }> }),
        options: this.transformOptions(product.options as Array<Record<string, unknown>>)
      };
    });
  }

  private transformVariants(variantsData: { edges: Array<{ node: Record<string, unknown> }> }): ShopifyProductListing['variants'] {
    return variantsData.edges.map(edge => {
      const variant = edge.node;
      const variantId = (variant.id as string).split('/').pop() || '0';
      const selectedOptions = variant.selectedOptions as Array<{ name: string; value: string }> || [];
      const price = variant.price as string || '0.00';
      const compareAtPrice = variant.compareAtPrice as string || null;
      
      return {
        id: parseInt(variantId, 10),
        title: variant.title as string || '',
        option_values: selectedOptions.map(opt => ({
          option_id: 0, // Not available in GraphQL
          name: opt.name,
          value: opt.value
        })),
        price: price,
        formatted_price: `$${price}`, // Simple formatting
        compare_at_price: compareAtPrice || price,
        grams: 0, // Weight not available in GraphQL ProductVariant
        requires_shipping: true, // Default to true for physical products
        sku: variant.sku as string || '',
        barcode: variant.barcode as string || '',
        available: variant.availableForSale as boolean || false,
        inventory_policy: variant.inventoryPolicy as string || 'deny',
        inventory_quantity: variant.inventoryQuantity as number || 0,
        weight: 0, // Weight not available in GraphQL ProductVariant
        weight_unit: 'kg', // Default weight unit
        position: variant.position as number || 1,
        created_at: variant.createdAt as string || new Date().toISOString(),
        updated_at: variant.updatedAt as string || new Date().toISOString()
      };
    });
  }

  private transformImages(imagesData: { edges: Array<{ node: Record<string, unknown> }> } | null): ShopifyProductListing['images'] {
    if (!imagesData) return [];
    
    return imagesData.edges.map((edge, index) => {
      const image = edge.node;
      const imageId = (image.id as string).split('/').pop() || '0';
      
      return {
        id: parseInt(imageId, 10),
        created_at: new Date().toISOString(), // Not available in GraphQL
        position: index + 1,
        updated_at: new Date().toISOString(), // Not available in GraphQL
        src: image.url as string || '',
        variant_ids: [] // Not available in GraphQL for product images
      };
    });
  }

  private transformOptions(optionsData: Array<Record<string, unknown>> | null): ShopifyProductListing['options'] {
    if (!optionsData) return [];
    
    return optionsData.map((option, index) => {
      const optionId = (option.id as string).split('/').pop() || '0';
      
      return {
        id: parseInt(optionId, 10),
        name: option.name as string || '',
        position: index + 1,
        values: (option.values as string[]) || []
      };
    });
  }

  /**
   * Truncate product description for customer service efficiency
   */
  private truncateDescription(description: string): string {
    if (!description) return '';
    
    // Remove HTML tags and truncate to 150 characters for AI context efficiency
    const plainText = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plainText.length > 150 ? plainText.substring(0, 147) + '...' : plainText;
  }
}