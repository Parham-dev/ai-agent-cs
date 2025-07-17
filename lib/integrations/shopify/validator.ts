import { ShopifyCredentials, ShopifyShopResponse, ValidationResponse } from './types';

/**
 * Validates Shopify store credentials by attempting to connect to the shop API
 * @param credentials - Store name and access token
 * @returns Promise<ValidationResponse> - Validation result with store info if successful
 */
export async function validateShopifyCredentials(
  credentials: ShopifyCredentials
): Promise<ValidationResponse> {
  try {
    const { shopUrl, accessToken } = credentials;

    if (!shopUrl || !accessToken) {
      return {
        isValid: false,
        message: 'Shop URL and access token are required'
      };
    }

    // Validate shop URL format  
    const cleanStoreName = shopUrl.replace('.myshopify.com', '').trim();
    if (!cleanStoreName.match(/^[a-zA-Z0-9-]+$/)) {
      return {
        isValid: false,
        message: 'Invalid store name format. Use only letters, numbers, and hyphens.'
      };
    }

    // Test the credentials by fetching shop information
    const shopifyUrl = `https://${cleanStoreName}.myshopify.com/admin/api/2024-01/shop.json`;
    
    const response = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to connect to Shopify store';
      
      switch (response.status) {
        case 401:
          errorMessage = 'Invalid access token. Please check your private app credentials.';
          break;
        case 404:
          errorMessage = 'Store not found. Please check your store name.';
          break;
        case 403:
          errorMessage = 'Access denied. Please ensure your private app has the required permissions.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again in a moment.';
          break;
        default:
          errorMessage = `Connection failed with status ${response.status}`;
      }

      return {
        isValid: false,
        message: errorMessage
      };
    }

    const data: ShopifyShopResponse = await response.json();
    
    if (!data.shop) {
      return {
        isValid: false,
        message: 'Invalid response from Shopify API'
      };
    }

    // Success - return shop information
    return {
      isValid: true,
      message: 'Successfully connected to your Shopify store!',
      storeInfo: {
        name: data.shop.name,
        domain: data.shop.domain,
        email: data.shop.email,
        country: data.shop.country_name,
        currency: data.shop.currency
      }
    };

  } catch (error) {
    console.error('Shopify validation error:', error);
    
    return {
      isValid: false,
      message: 'An unexpected error occurred while validating your credentials. Please try again.'
    };
  }
}

/**
 * Validates store name format without making API calls
 * @param storeName - Store name to validate
 * @returns boolean - Whether the store name format is valid
 */
export function isValidStoreNameFormat(storeName: string): boolean {
  const cleanStoreName = storeName.replace('.myshopify.com', '').trim();
  return cleanStoreName.match(/^[a-zA-Z0-9-]+$/) !== null;
}

/**
 * Cleans store name by removing .myshopify.com suffix and trimming
 * @param storeName - Raw store name input
 * @returns string - Cleaned store name
 */
export function cleanStoreName(storeName: string): string {
  return storeName.replace('.myshopify.com', '').trim();
} 