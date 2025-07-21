import { BaseShopifyClient } from '../base';
import { ShopifyPolicy } from '../../types';

export class GetPoliciesService extends BaseShopifyClient {
  /**
   * Get store policies using GraphQL shop query
   */
  async getPolicies(): Promise<ShopifyPolicy[]> {
    const query = `
      query getShopPolicies {
        shop {
          shopPolicies {
            id
            title
            url
            type
          }
        }
      }
    `;

    const result = await this.makeGraphQLRequest(query, {});
    
    if (!result.data || !result.data.shop) {
      return [];
    }

    const shop = result.data.shop as Record<string, unknown>;
    
    if (!shop.shopPolicies) {
      return [];
    }

    // Transform shopPolicies array to ShopifyPolicy format
    return (shop.shopPolicies as Array<Record<string, unknown>>).map(policy => {
      const policyId = (policy.id as string).split('/').pop() || '0';
      const policyType = (policy.type as string).toLowerCase().replace('_', '');
      
      return {
        title: policy.title as string || '',
        body: '', // Removed full body - customers should visit the URL instead for token efficiency
        created_at: new Date().toISOString(), // Not available in GraphQL, using current time
        updated_at: new Date().toISOString(), // Not available in GraphQL, using current time
        handle: policyType,
        id: parseInt(policyId, 10),
        url: policy.url as string || ''
      };
    });
  }
}