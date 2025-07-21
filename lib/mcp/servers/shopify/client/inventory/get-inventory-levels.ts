import { BaseShopifyClient } from '../base';
import { ShopifyInventoryLevel } from '../../types';

export class GetInventoryLevelsService extends BaseShopifyClient {
  /**
   * Get inventory levels using GraphQL
   */
  async getInventoryLevels(locationId?: number, limit: number = 50): Promise<ShopifyInventoryLevel[]> {
    const locationGid = locationId ? `gid://shopify/Location/${locationId}` : null;
    
    if (locationGid) {
      // Query for specific location
      const query = `
        query getInventoryLevels($first: Int, $locationId: ID!) {
          location(id: $locationId) {
            id
            inventoryLevels(first: $first) {
              edges {
                node {
                  id
                  quantities(names: ["available", "incoming", "committed", "on_hand"]) {
                    name
                    quantity
                  }
                  item {
                    id
                    sku
                    variant {
                      id
                      product {
                        id
                      }
                    }
                  }
                  updatedAt
                }
              }
            }
          }
        }
      `;

      const result = await this.makeGraphQLRequest(query, {
        first: Math.min(limit, 250),
        locationId: locationGid
      });

      if (!result.data || !result.data.location) {
        return [];
      }
      
      const location = result.data.location as Record<string, unknown>;
      if (!location.inventoryLevels) {
        return [];
      }

      return this.transformInventoryLevels(
        location.inventoryLevels as { edges: Array<{ node: Record<string, unknown> }> },
        locationId || 0
      );
    } else {
      // Query inventory items with levels for all locations
      const query = `
        query getInventoryItems($first: Int) {
          inventoryItems(first: $first) {
            edges {
              node {
                id
                sku
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      id
                      location {
                        id
                      }
                      quantities(names: ["available", "incoming", "committed", "on_hand"]) {
                        name
                        quantity
                      }
                      updatedAt
                    }
                  }
                }
                variant {
                  id
                  product {
                    id
                  }
                }
              }
            }
          }
        }
      `;

      const result = await this.makeGraphQLRequest(query, {
        first: Math.min(limit, 250)
      });

      if (!result.data || !result.data.inventoryItems) {
        return [];
      }

      // Flatten inventory levels from all items
      const inventoryLevels: ShopifyInventoryLevel[] = [];
      const items = result.data.inventoryItems as { edges: Array<{ node: Record<string, unknown> }> };
      
      items.edges.forEach(itemEdge => {
        const item = itemEdge.node;
        const levels = item.inventoryLevels as { edges: Array<{ node: Record<string, unknown> }> };
        
        levels.edges.forEach(levelEdge => {
          const level = levelEdge.node;
          const locationIdStr = ((level.location as { id: string }).id).split('/').pop() || '0';
          inventoryLevels.push(this.transformInventoryLevel(level, parseInt(locationIdStr, 10)));
        });
      });

      return inventoryLevels.slice(0, limit);
    }
  }

  private transformInventoryLevels(
    levelsData: { edges: Array<{ node: Record<string, unknown> }> },
    locationId: number
  ): ShopifyInventoryLevel[] {
    return levelsData.edges.map(edge => this.transformInventoryLevel(edge.node, locationId));
  }

  private transformInventoryLevel(
    level: Record<string, unknown>,
    locationId: number
  ): ShopifyInventoryLevel {
    const quantities = level.quantities as Array<{ name: string; quantity: number }> || [];
    const quantityMap: Record<string, number> = {};
    quantities.forEach(q => {
      quantityMap[q.name] = q.quantity;
    });

    const item = level.item as Record<string, unknown>;
    const inventoryItemId = item ? (item.id as string).split('/').pop() || '0' : '0';

    return {
      inventory_item_id: parseInt(inventoryItemId, 10),
      location_id: locationId,
      available: quantityMap.available || 0,
      updated_at: level.updatedAt as string || new Date().toISOString(),
      admin_graphql_api_id: level.id as string || `gid://shopify/InventoryLevel/${inventoryItemId}_${locationId}`
    };
  }
}