/**
 * Base API Client - provides shared functionality for all domain clients
 * Handles authentication and common request logic
 * Organization scoping is handled automatically by server middleware
 */

import { tokenProvider } from './token-provider';
import type { ApiResponse, ApiErrorCode } from '@/lib/types';
import { ApiError, API_ERROR_CODES } from './error';
import type { BaseApiClientOptions, ListFilters } from './types';

export abstract class BaseApiClient {
  protected baseUrl: string;
  protected requireAuth: boolean;

  constructor(options: BaseApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || '/api/v2';
    this.requireAuth = options.requireAuth ?? true;
  }

  /**
   * Get current auth token using the token provider
   */
  protected async getAuthToken(): Promise<string | null> {
    return tokenProvider.getToken();
  }

  /**
   * Build URL parameters for list endpoints
   */
  protected buildUrlParams(filters?: ListFilters): URLSearchParams {
    const params = new URLSearchParams();
    
    // Convert all filter values to URL parameters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    return params;
  }

  /**
   * Core request method with authentication, timeout, and error handling
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get auth token if authentication is required
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.requireAuth) {
      const token = await this.getAuthToken();
      if (!token) {
        throw new ApiError(
          API_ERROR_CODES.AUTHENTICATION_ERROR,
          'Missing or invalid authorization header'
        );
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(
          API_ERROR_CODES.SERVICE_UNAVAILABLE,
          'Request timeout - the server is not responding'
        );
      }
      console.error('API request failed:', error);
      throw error;
    }

    if (!response.ok) {
      // Handle non-JSON error responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData: ApiResponse = await response.json();
        throw new ApiError(
          (errorData.error?.code as ApiErrorCode) || API_ERROR_CODES.INTERNAL_ERROR,
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.error?.details
        );
      } else {
        throw new ApiError(
          API_ERROR_CODES.INTERNAL_ERROR,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
    }

    // Handle response data
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data: ApiResponse<T> = await response.json();
      
      if (!data.success) {
        throw new ApiError(
          (data.error?.code as ApiErrorCode) || API_ERROR_CODES.INTERNAL_ERROR,
          data.error?.message || 'Request failed',
          data.error?.details
        );
      }
      
      return data.data!;
    }

    // For non-JSON responses (like DELETE operations)
    return undefined as T;
  }
}