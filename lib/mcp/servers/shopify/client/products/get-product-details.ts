import { BaseShopifyClient } from '../base';
import { ShopifyProduct } from '../../types';

export class GetProductDetailsService extends BaseShopifyClient {
  /**
   * Get product details by ID using GraphQL
   */
  async getProductDetails(productId: string): Promise<ShopifyProduct | null> {
    const query = `
      query product($id: ID!) {
        product(id: $id) {
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
          collections(first: 10) {
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
          variants(first: 100) {
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
                position
                createdAt
                updatedAt
              }
            }
          }
          images(first: 20) {
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
            position
            values
          }
          seo {
            title
            description
          }
        }
      }
    `;

    const variables = {
      id: `gid://shopify/Product/${productId}`
    };

    const result = await this.makeGraphQLRequest(query, variables);
    
    if (!result.data || !result.data.product) {
      return null;
    }

    return this.transformProductResponse(result.data.product as Record<string, unknown>);
  }

  /**
   * Transform GraphQL product response to internal format
   */
  private transformProductResponse(productData: Record<string, unknown>): ShopifyProduct {
    const variants = (productData.variants as { edges: Array<{ node: Record<string, unknown> }> }).edges.map((variantEdge) => {
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

    const images = (productData.images as { edges: Array<{ node: Record<string, unknown> }> }).edges.map((imageEdge) => ({
      id: Number((imageEdge.node.id as string).split('/').pop()),
      src: imageEdge.node.url as string,
      url: imageEdge.node.url as string,
      alt: imageEdge.node.altText as string,
      altText: imageEdge.node.altText as string
    }));

    const collections = (productData.collections as { edges: Array<{ node: Record<string, unknown> }> }).edges.map((collectionEdge) => ({
      id: (collectionEdge.node.id as string).split('/').pop() || '',
      title: collectionEdge.node.title as string
    }));

    const options = (productData.options as Array<Record<string, unknown>>).map((option) => ({
      id: Number(option.id),
      name: option.name as string,
      values: option.values as string[]
    }));

    const hasOnSaleVariants = variants.some((v) => v.onSale);
    
    return {
      id: Number((productData.id as string).split('/').pop()),
      title: productData.title as string,
      handle: productData.handle as string,
      vendor: productData.vendor as string,
      product_type: productData.productType as string,
      body_html: this.truncateDescription(productData.description as string),
      tags: (productData.tags as string[]).join(','),
      variants,
      images,
      collections,
      priceRange: {
        min: (productData.priceRangeV2 as { minVariantPrice: { amount: string } }).minVariantPrice.amount,
        max: (productData.priceRangeV2 as { maxVariantPrice: { amount: string } }).maxVariantPrice.amount
      },
      onSale: hasOnSaleVariants,
      totalInventory: productData.totalInventory as number,
      onlineStoreUrl: productData.onlineStoreUrl as string,
      created_at: productData.createdAt as string,
      updated_at: productData.updatedAt as string,
      published_at: productData.publishedAt as string,
      status: (productData.status as string).toLowerCase(),
      options
    };
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