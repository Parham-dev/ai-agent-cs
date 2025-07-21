import { BaseShopifyClient } from '../base';
import { ShopifyPage } from '../../types';

export class GetPagesService extends BaseShopifyClient {
  /**
   * Get online store pages using GraphQL
   */
  async getPages(limit: number = 50): Promise<ShopifyPage[]> {
    const query = `
      query getPages($first: Int) {
        pages(first: $first) {
          edges {
            node {
              id
              title
              handle
              bodySummary
              createdAt
              updatedAt
              publishedAt
              templateSuffix
              isPublished
            }
          }
        }
      }
    `;

    const variables = {
      first: Math.min(limit, 250)
    };

    const result = await this.makeGraphQLRequest(query, variables);
    
    if (!result.data || !result.data.pages) {
      return [];
    }

    // Transform GraphQL response to match ShopifyPage format
    return (result.data.pages as { edges: Array<{ node: Record<string, unknown> }> }).edges.map(edge => {
      const page = edge.node;
      const pageId = (page.id as string).split('/').pop() || '0';
      
      return {
        id: parseInt(pageId, 10),
        title: page.title as string || '',
        shop_id: 0, // Not available in GraphQL
        handle: page.handle as string || '',
        body_html: page.bodySummary as string || '', // Brief summary (first 150 chars) - perfect for AI context
        author: '', // Not available in GraphQL
        created_at: page.createdAt as string || new Date().toISOString(),
        updated_at: page.updatedAt as string || new Date().toISOString(),
        published_at: page.publishedAt as string || page.createdAt as string,
        template_suffix: page.templateSuffix as string || '',
        admin_graphql_api_id: page.id as string
      };
    });
  }
}