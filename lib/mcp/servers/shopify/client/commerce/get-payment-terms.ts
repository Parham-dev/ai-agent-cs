import { BaseShopifyClient } from '../base';
import { ShopifyPaymentTerm } from '../../types';

export class GetPaymentTermsService extends BaseShopifyClient {
  /**
   * Get payment terms templates using GraphQL
   */
  async getPaymentTerms(limit: number = 50): Promise<ShopifyPaymentTerm[]> {
    const query = `
      query paymentTermsTemplates {
        paymentTermsTemplates {
          id
          name
          translatedName
          paymentTermsType
          dueInDays
          description
        }
      }
    `;

    const result = await this.makeGraphQLRequest(query, {});
    
    if (!result.data || !result.data.paymentTermsTemplates) {
      // Return empty array if no payment terms are configured
      return [];
    }
    
    // Transform to match expected format
    return (result.data.paymentTermsTemplates as Array<Record<string, unknown>>).slice(0, limit).map((template, index) => ({
      id: index + 1, // GraphQL returns string IDs, but type expects number
      name: template.name as string || '',
      net_payment_term_days: template.dueInDays as number || 0,
      payment_schedules: [], // Templates don't have schedules, only actual payment terms on orders do
      type: 'STANDARD', // Default type for templates
      payment_terms_type: template.paymentTermsType as string || '',
      due_in_days: template.dueInDays as number || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_graphql_api_id: template.id as string || ''
    }));
  }
}