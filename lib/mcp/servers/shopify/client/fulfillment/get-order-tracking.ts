import { BaseShopifyClient } from '../base';
import { OrderTrackingParams, OrderTrackingResponse } from '../../types';

export class GetOrderTrackingService extends BaseShopifyClient {
  /**
   * Track order status by order number - optimized for customer service
   * No authentication required, just order number (perfect for customer service)
   */
  async getOrderTracking(params: OrderTrackingParams): Promise<OrderTrackingResponse> {
    const { orderNumber } = params;
    
    // GraphQL query to get order and fulfillment details by order number
    const query = `
      query getOrderTracking($query: String!) {
        orders(first: 1, query: $query) {
          edges {
            node {
              id
              name
              orderNumber
              createdAt
              updatedAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                email
                firstName
                lastName
              }
              shippingAddress {
                firstName
                lastName
                company
                address1
                address2
                city
                province
                country
                zip
                phone
              }
              lineItems(first: 50) {
                edges {
                  node {
                    id
                    title
                    quantity
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                    sku
                    variantTitle
                    fulfillmentStatus
                  }
                }
              }
              fulfillments(first: 10) {
                edges {
                  node {
                    id
                    status
                    createdAt
                    updatedAt
                    trackingInfo {
                      company
                      number
                      url
                    }
                    estimatedDeliveryAt
                    displayStatus
                    fulfillmentLineItems(first: 50) {
                      edges {
                        node {
                          lineItem {
                            id
                            title
                            sku
                          }
                          quantity
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
      query: `name:${orderNumber}`
    };

    try {
      const result = await this.makeGraphQLRequest(query, variables);
      
      const data = result.data as Record<string, unknown> | null;
      const orders = data?.orders as { edges?: Array<{ node: Record<string, unknown> }> } | null;
      
      if (!data || !orders || !orders.edges?.length) {
        return {
          order: null,
          tracking_info: {
            has_tracking: false,
            tracking_numbers: [],
            tracking_urls: [],
            shipment_status: null,
            estimated_delivery: null
          }
        };
      }

      const orderNode = orders.edges[0].node;
      
      // Transform fulfillments
      const fulfillmentEdges = orderNode.fulfillments as { edges?: Array<{ node: Record<string, unknown> }> } || { edges: [] };
      const fulfillments = (fulfillmentEdges.edges || []).map((edge) => {
        const fulfillment = edge.node;
        const trackingInfo = fulfillment.trackingInfo as Array<{ company?: string; number?: string; url?: string }> || [];
        const fulfillmentLineItems = fulfillment.fulfillmentLineItems as { edges?: Array<{ node: Record<string, unknown> }> } || { edges: [] };
        
        return {
          id: (fulfillment.id as string).split('/').pop() || '',
          status: (fulfillment.status as string) || (fulfillment.displayStatus as string) || 'unknown',
          created_at: fulfillment.createdAt as string,
          updated_at: fulfillment.updatedAt as string,
          tracking_company: trackingInfo[0]?.company || null,
          tracking_number: trackingInfo[0]?.number || null,
          tracking_url: trackingInfo[0]?.url || null,
          shipment_status: (fulfillment.displayStatus as string) || null,
          estimated_delivery: (fulfillment.estimatedDeliveryAt as string) || null,
          line_items: (fulfillmentLineItems.edges || []).map((lineItemEdge) => {
            const lineItemNode = lineItemEdge.node;
            const lineItem = lineItemNode.lineItem as Record<string, unknown>;
            return {
              id: (lineItem.id as string).split('/').pop() || '',
              title: lineItem.title as string,
              quantity: lineItemNode.quantity as number,
              sku: (lineItem.sku as string) || ''
            };
          })
        };
      });

      // Collect tracking info
      const trackingNumbers: string[] = [];
      const trackingUrls: string[] = [];
      let shipmentStatus: string | null = null;
      let estimatedDelivery: string | null = null;

      fulfillments.forEach((fulfillment) => {
        if (fulfillment.tracking_number) {
          trackingNumbers.push(fulfillment.tracking_number);
        }
        if (fulfillment.tracking_url) {
          trackingUrls.push(fulfillment.tracking_url);
        }
        if (fulfillment.shipment_status && !shipmentStatus) {
          shipmentStatus = fulfillment.shipment_status;
        }
        if (fulfillment.estimated_delivery && !estimatedDelivery) {
          estimatedDelivery = fulfillment.estimated_delivery;
        }
      });

      // Transform customer data
      const customer = orderNode.customer as Record<string, unknown> | null;
      const shippingAddress = orderNode.shippingAddress as Record<string, unknown> | null;
      const totalPriceSet = orderNode.totalPriceSet as { shopMoney?: { amount?: string; currencyCode?: string } } | null;
      const lineItemsData = orderNode.lineItems as { edges?: Array<{ node: Record<string, unknown> }> } || { edges: [] };

      const transformedOrder = {
        id: (orderNode.id as string).split('/').pop() || '',
        name: orderNode.name as string,
        order_number: orderNode.orderNumber as number,
        created_at: orderNode.createdAt as string,
        updated_at: orderNode.updatedAt as string,
        financial_status: (orderNode.displayFinancialStatus as string) || 'unknown',
        fulfillment_status: (orderNode.displayFulfillmentStatus as string) || null,
        total_price: totalPriceSet?.shopMoney?.amount || '0.00',
        currency: totalPriceSet?.shopMoney?.currencyCode || 'USD',
        customer: customer ? {
          email: (customer.email as string) || '',
          first_name: (customer.firstName as string) || '',
          last_name: (customer.lastName as string) || ''
        } : null,
        shipping_address: shippingAddress ? {
          first_name: (shippingAddress.firstName as string) || '',
          last_name: (shippingAddress.lastName as string) || '',
          company: (shippingAddress.company as string) || null,
          address1: (shippingAddress.address1 as string) || '',
          address2: (shippingAddress.address2 as string) || null,
          city: (shippingAddress.city as string) || '',
          province: (shippingAddress.province as string) || '',
          country: (shippingAddress.country as string) || '',
          zip: (shippingAddress.zip as string) || '',
          phone: (shippingAddress.phone as string) || null
        } : null,
        line_items: (lineItemsData.edges || []).map((edge) => {
          const lineItem = edge.node;
          const originalUnitPriceSet = lineItem.originalUnitPriceSet as { shopMoney?: { amount?: string } } | null;
          return {
            id: (lineItem.id as string).split('/').pop() || '',
            title: lineItem.title as string,
            quantity: lineItem.quantity as number,
            price: originalUnitPriceSet?.shopMoney?.amount || '0.00',
            sku: (lineItem.sku as string) || '',
            variant_title: (lineItem.variantTitle as string) || '',
            fulfillment_status: (lineItem.fulfillmentStatus as string) || null
          };
        }),
        fulfillments
      };

      return {
        order: transformedOrder,
        tracking_info: {
          has_tracking: trackingNumbers.length > 0,
          tracking_numbers: trackingNumbers,
          tracking_urls: trackingUrls,
          shipment_status: shipmentStatus,
          estimated_delivery: estimatedDelivery
        }
      };

    } catch (error) {
      console.error('Error fetching order tracking:', error);
      return {
        order: null,
        tracking_info: {
          has_tracking: false,
          tracking_numbers: [],
          tracking_urls: [],
          shipment_status: null,
          estimated_delivery: null
        }
      };
    }
  }
}