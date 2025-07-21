import { BaseShopifyClient } from '../base';
import { ShopifyInventoryItem } from '../../types';

export class GetInventoryItemsService extends BaseShopifyClient {
  /**
   * Get inventory items using GraphQL
   */
  async getInventoryItems(limit: number = 50): Promise<ShopifyInventoryItem[]> {
    const query = `
      query getInventoryItems($first: Int) {
        inventoryItems(first: $first) {
          edges {
            node {
              id
              sku
              tracked
              requiresShipping
              countryCodeOfOrigin
              provinceCodeOfOrigin
              harmonizedSystemCode
              countryHarmonizedSystemCodes {
                edges {
                  node {
                    countryCode
                    harmonizedSystemCode
                  }
                }
              }
              createdAt
              updatedAt
              variant {
                id
                title
                product {
                  id
                  title
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
    
    if (!result.data || !result.data.inventoryItems) {
      return [];
    }

    // Transform GraphQL response to match ShopifyInventoryItem format
    return (result.data.inventoryItems as { edges: Array<{ node: Record<string, unknown> }> }).edges.map(edge => {
      const item = edge.node;
      const itemId = (item.id as string).split('/').pop() || '0';
      
      return {
        id: parseInt(itemId, 10),
        sku: item.sku as string || '',
        created_at: item.createdAt as string,
        updated_at: item.updatedAt as string,
        requires_shipping: item.requiresShipping as boolean || false,
        cost: '0.00', // Not available in GraphQL
        country_code_of_origin: item.countryCodeOfOrigin as string || '',
        province_code_of_origin: item.provinceCodeOfOrigin as string || '',
        harmonized_system_code: item.harmonizedSystemCode as string || '',
        tracked: item.tracked as boolean || true,
        country_harmonized_system_codes: this.transformCountryCodes(
          item.countryHarmonizedSystemCodes as { edges: Array<{ node: Record<string, unknown> }> }
        ),
        admin_graphql_api_id: item.id as string
      };
    });
  }

  private transformCountryCodes(codesData: { edges: Array<{ node: Record<string, unknown> }> } | null): Array<{ country_code: string; harmonized_system_code: string }> {
    if (!codesData) return [];
    
    return codesData.edges.map(edge => ({
      country_code: edge.node.countryCode as string,
      harmonized_system_code: edge.node.harmonizedSystemCode as string
    }));
  }
}