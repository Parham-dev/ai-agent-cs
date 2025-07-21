import { BaseShopifyClient } from '../base';

export interface ShippingZone {
  id: string;
  name: string;
  countries: Array<{
    code: string;
    name: string;
    restOfWorld: boolean;
    provinces: Array<{
      code: string;
      name: string;
    }>;
  }>;
  shippingMethods: Array<{
    id: string;
    description: string;
    active: boolean;
    conditions: Array<{
      field: string;
      operator: string;
      criteria: {
        amount?: string;
        currencyCode?: string;
        weight?: number;
        weightUnit?: string;
      };
    }>;
  }>;
}

export interface DeliveryProfile {
  id: string;
  name: string;
  default: boolean;
  activeMethodDefinitionsCount: number;
  locationsWithoutRatesCount: number;
  shippingZones: ShippingZone[];
}

export class GetShippingZonesService extends BaseShopifyClient {
  /**
   * Get shipping zones using GraphQL delivery profiles
   */
  async getShippingZones(): Promise<DeliveryProfile[]> {
    const query = `
      query deliveryProfiles($first: Int) {
        deliveryProfiles(first: $first) {
          edges {
            node {
              id
              name
              default
              activeMethodDefinitionsCount
              locationsWithoutRatesCount
              profileLocationGroups {
                locationGroupZones(first: 10) {
                  edges {
                    node {
                      zone {
                        id
                        name
                        countries {
                          code {
                            countryCode
                            restOfWorld
                          }
                          name
                        }
                      }
                      methodDefinitions(first: 10) {
                        edges {
                          node {
                            id
                            active
                            description
                            methodConditions {
                              field
                              operator
                              conditionCriteria {
                                __typename
                                ... on MoneyV2 {
                                  amount
                                  currencyCode
                                }
                                ... on Weight {
                                  unit
                                  value
                                }
                              }
                            }
                          }
                        }
                      }
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
      first: 10
    };

    const result = await this.makeGraphQLRequest(query, variables);
    
    if (!result.data || !result.data.deliveryProfiles) {
      throw new Error(`GraphQL response missing delivery profiles data. Full response: ${JSON.stringify(result, null, 2)}`);
    }
    
    return this.transformDeliveryProfilesResponse(result.data.deliveryProfiles as { edges: Array<{ node: Record<string, unknown> }> });
  }

  /**
   * Transform GraphQL delivery profiles response to internal format
   */
  private transformDeliveryProfilesResponse(profilesData: { edges: Array<{ node: Record<string, unknown> }> }): DeliveryProfile[] {
    return profilesData.edges.map((edge) => {
      const node = edge.node;
      const locationGroups = node.profileLocationGroups as Array<{
        locationGroupZones: { edges: Array<{ node: Record<string, unknown> }> };
      }>;

      const shippingZones: ShippingZone[] = [];
      
      locationGroups.forEach((locationGroup) => {
        locationGroup.locationGroupZones.edges.forEach((zoneEdge) => {
          const zoneNode = zoneEdge.node;
          const zone = zoneNode.zone as Record<string, unknown>;
          
          const countries = (zone.countries as Array<Record<string, unknown>>).map((country) => ({
            code: (country.code as { countryCode: string }).countryCode,
            name: country.name as string,
            restOfWorld: (country.code as { restOfWorld: boolean }).restOfWorld || false,
            provinces: [] // Provinces removed to reduce query cost
          }));

          const methodDefinitions = zoneNode.methodDefinitions as { edges: Array<{ node: Record<string, unknown> }> };
          const shippingMethods = methodDefinitions.edges.map((methodEdge) => {
            const method = methodEdge.node;
            const conditions = (method.methodConditions as Array<Record<string, unknown>> || []).map((condition) => {
              const criteria = condition.conditionCriteria as Record<string, unknown>;
              
              return {
                field: condition.field as string,
                operator: condition.operator as string,
                criteria: {
                  amount: criteria?.__typename === 'MoneyV2' ? (criteria.amount as string) : undefined,
                  currencyCode: criteria?.__typename === 'MoneyV2' ? (criteria.currencyCode as string) : undefined,
                  weight: criteria?.__typename === 'Weight' ? (criteria.value as number) : undefined,
                  weightUnit: criteria?.__typename === 'Weight' ? (criteria.unit as string) : undefined
                }
              };
            });

            return {
              id: (method.id as string).split('/').pop() || '',
              description: method.description as string,
              active: method.active as boolean,
              conditions
            };
          });

          shippingZones.push({
            id: (zone.id as string).split('/').pop() || '',
            name: zone.name as string,
            countries,
            shippingMethods
          });
        });
      });

      return {
        id: (node.id as string).split('/').pop() || '',
        name: node.name as string,
        default: node.default as boolean,
        activeMethodDefinitionsCount: node.activeMethodDefinitionsCount as number,
        locationsWithoutRatesCount: node.locationsWithoutRatesCount as number,
        shippingZones
      };
    });
  }
}