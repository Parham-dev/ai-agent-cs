import { GetMarketingEventsService } from './get-marketing-events';
import { MCPServerCredentials } from '../../types';

/**
 * Main Marketing service optimized for customer service contexts
 */
export class MarketingService extends GetMarketingEventsService {
  constructor(credentials: MCPServerCredentials['credentials'], settings?: MCPServerCredentials['settings']) {
    super(credentials, settings);
  }

  /**
   * Get marketing events relevant for customer service
   * (inherited from GetMarketingEventsService)
   */
  // getMarketingEvents method is inherited
}