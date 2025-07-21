import { BaseShopifyClient } from '../base';
import { ShopifyLocation } from '../../types';

export class GetLocationsService extends BaseShopifyClient {
  /**
   * Get store locations using GraphQL
   */
  async getLocations(): Promise<ShopifyLocation[]> {
    const query = `
      query getLocations($first: Int) {
        locations(first: $first) {
          edges {
            node {
              id
              name
              isActive
              fulfillsOnlineOrders
              address {
                address1
                address2
                city
                province
                provinceCode
                country
                countryCode
                zip
                phone
              }
            }
          }
        }
      }
    `;

    const variables = {
      first: 50
    };

    const result = await this.makeGraphQLRequest(query, variables);
    
    if (!result.data || !result.data.locations) {
      return [];
    }

    // Transform GraphQL response to match ShopifyLocation format
    return (result.data.locations as { edges: Array<{ node: Record<string, unknown> }> }).edges.map(edge => {
      const location = edge.node;
      const locationId = (location.id as string).split('/').pop() || '0';
      const address = location.address as Record<string, unknown> || {};
      
      return {
        id: parseInt(locationId, 10),
        name: location.name as string,
        address1: address.address1 as string || '',
        address2: address.address2 as string || undefined,
        city: address.city as string || '',
        province: address.province as string || '',
        province_code: address.provinceCode as string || '',
        country: address.country as string || '',
        country_code: address.countryCode as string || '',
        zip: address.zip as string || '',
        phone: address.phone as string || '',
        created_at: new Date().toISOString(), // Not available in GraphQL
        updated_at: new Date().toISOString(), // Not available in GraphQL
        country_name: address.country as string || '',
        legacy: false,
        active: location.isActive as boolean || true,
        admin_graphql_api_id: location.id as string,
        localized_country_name: address.country as string || '',
        localized_province_name: address.province as string || ''
      };
    });
  }
}