import { GetOrderTrackingService } from './get-order-tracking';
import { MCPServerCredentials } from '../../types';

/**
 * Main Fulfillment service for order tracking - optimized for customer service
 */
export class FulfillmentService extends GetOrderTrackingService {
  constructor(credentials: MCPServerCredentials['credentials'], settings?: MCPServerCredentials['settings']) {
    super(credentials, settings);
  }

  /**
   * Track order by order number - perfect for customer service
   * No authentication required, customers just provide their order number
   * (inherited from GetOrderTrackingService)
   */
  // getOrderTracking method is inherited
}