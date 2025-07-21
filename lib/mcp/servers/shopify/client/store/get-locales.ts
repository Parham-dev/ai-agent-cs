import { BaseShopifyClient } from '../base';
import { ShopifyLocale } from '../../types';

export class GetLocalesService extends BaseShopifyClient {
  /**
   * Get available locales using GraphQL
   */
  async getLocales(): Promise<ShopifyLocale[]> {
    const query = `
      query getShopLocales {
        shopLocales {
          locale
          name
          primary
          published
        }
      }
    `;

    const result = await this.makeGraphQLRequest(query, {});
    
    if (!result.data || !result.data.shopLocales) {
      return [];
    }

    // Transform GraphQL response to match ShopifyLocale format
    return (result.data.shopLocales as Array<Record<string, unknown>>).map(localeItem => ({
      locale: localeItem.locale as string || '',
      name: localeItem.name as string || '',
      primary: localeItem.primary as boolean || false,
      published: localeItem.published as boolean || true
    }));
  }
}