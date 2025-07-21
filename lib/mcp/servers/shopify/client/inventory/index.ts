import { GetLocationsService } from './get-locations';
import { GetInventoryLevelsService } from './get-inventory-levels';
import { GetInventoryItemsService } from './get-inventory-items';
import { MCPServerCredentials, ShopifyInventoryLevel, ShopifyInventoryItem } from '../../types';

/**
 * Main Inventory service that composes all inventory-related operations
 */
export class InventoryService extends GetLocationsService {
  private getInventoryLevelsService: GetInventoryLevelsService;
  private getInventoryItemsService: GetInventoryItemsService;

  constructor(credentials: MCPServerCredentials['credentials'], settings?: MCPServerCredentials['settings']) {
    super(credentials, settings);
    this.getInventoryLevelsService = new GetInventoryLevelsService(credentials, settings);
    this.getInventoryItemsService = new GetInventoryItemsService(credentials, settings);
  }

  /**
   * Get store locations (inherited from GetLocationsService)
   */
  // getLocations method is inherited

  /**
   * Get inventory levels for a location
   */
  async getInventoryLevels(locationId?: number, limit?: number): Promise<ShopifyInventoryLevel[]> {
    return this.getInventoryLevelsService.getInventoryLevels(locationId, limit);
  }

  /**
   * Get inventory items
   */
  async getInventoryItems(limit?: number): Promise<ShopifyInventoryItem[]> {
    return this.getInventoryItemsService.getInventoryItems(limit);
  }
}