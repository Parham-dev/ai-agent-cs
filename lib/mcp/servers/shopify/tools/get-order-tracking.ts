import { createShopifyTool } from './base-tool-factory';
import { OrderTrackingParams, OrderTrackingResponse } from '../types';
import { ShopifyMCPClient } from '../client';

export const getOrderTrackingTool = createShopifyTool({
  name: 'getOrderTracking',
  description: 'Track order status by order number - perfect for customer service without authentication',
  inputSchema: {
    type: 'object',
    properties: {
      orderNumber: {
        type: 'string',
        description: 'The order number to track (e.g., "#1234", "1234")'
      }
    },
    required: ['orderNumber']
  },
  handler: async (client: ShopifyMCPClient, params: OrderTrackingParams) => {
    // Clean order number - remove # if present and ensure it's a string
    const cleanOrderNumber = params.orderNumber.replace(/^#/, '');
    
    const response = await client.getOrderTracking({ 
      orderNumber: cleanOrderNumber 
    });
    
    return formatOrderTrackingResponse(response);
  }
});

/**
 * Format the order tracking response for customer service readability
 */
function formatOrderTrackingResponse(response: OrderTrackingResponse): Record<string, unknown> {
  if (!response.order) {
    return {
      found: false,
      message: 'Order not found. Please verify the order number and try again.',
      order: null,
      tracking: null
    };
  }

  const { order, tracking_info } = response;
  
  // Format fulfillment status for customer understanding
  const getStatusMessage = (fulfillmentStatus: string | null, financialStatus: string) => {
    if (!fulfillmentStatus) {
      if (financialStatus.toLowerCase() === 'paid') {
        return 'Order confirmed - preparing for shipment';
      } else {
        return 'Order received - awaiting payment confirmation';
      }
    }
    
    switch (fulfillmentStatus.toLowerCase()) {
      case 'fulfilled':
        return 'Order shipped and delivered';
      case 'partial':
        return 'Order partially shipped';
      case 'unfulfilled':
        return 'Order confirmed - preparing for shipment';
      default:
        return fulfillmentStatus;
    }
  };

  return {
    found: true,
    order: {
      order_number: order.name,
      status: getStatusMessage(order.fulfillment_status, order.financial_status),
      order_date: new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      total: `${order.currency} ${order.total_price}`,
      payment_status: order.financial_status,
      customer: order.customer ? {
        name: `${order.customer.first_name} ${order.customer.last_name}`.trim(),
        email: order.customer.email
      } : null,
      shipping_address: order.shipping_address ? {
        name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`.trim(),
        address: [
          order.shipping_address.address1,
          order.shipping_address.address2,
          order.shipping_address.city,
          order.shipping_address.province,
          order.shipping_address.country,
          order.shipping_address.zip
        ].filter(Boolean).join(', '),
        phone: order.shipping_address.phone
      } : null,
      items: order.line_items.map(item => ({
        title: item.title,
        quantity: item.quantity,
        price: `${order.currency} ${item.price}`,
        sku: item.sku,
        variant: item.variant_title,
        status: item.fulfillment_status || 'pending'
      }))
    },
    tracking: tracking_info.has_tracking ? {
      has_tracking: true,
      tracking_numbers: tracking_info.tracking_numbers,
      tracking_urls: tracking_info.tracking_urls,
      shipment_status: tracking_info.shipment_status,
      estimated_delivery: tracking_info.estimated_delivery ? 
        new Date(tracking_info.estimated_delivery).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : null,
      fulfillments: order.fulfillments.map(fulfillment => ({
        status: fulfillment.status,
        shipped_date: new Date(fulfillment.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        tracking_company: fulfillment.tracking_company,
        tracking_number: fulfillment.tracking_number,
        tracking_url: fulfillment.tracking_url,
        items: fulfillment.line_items.map(item => ({
          title: item.title,
          quantity: item.quantity,
          sku: item.sku
        }))
      }))
    } : {
      has_tracking: false,
      message: 'Tracking information not yet available. Order may still be processing.'
    }
  };
}