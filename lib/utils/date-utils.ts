/**
 * Date Utilities
 * Centralized date formatting and conversion functions
 */

/**
 * Get current timestamp in ISO format
 * Replaces scattered `new Date().toISOString()` calls
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Convert Unix timestamp to milliseconds
 * Handles Supabase session expiry format
 */
export function unixToMilliseconds(unixTimestamp: number): number {
  return unixTimestamp * 1000;
}

/**
 * Convert Unix timestamp to Date object
 */
export function unixToDate(unixTimestamp: number): Date {
  return new Date(unixTimestamp * 1000);
}

/**
 * Get Date.getTime() from Unix timestamp
 * Simplified version of complex conversion patterns
 */
export function unixToTimeValue(unixTimestamp: number): number {
  return unixTimestamp * 1000;
}

/**
 * Convert Date to ISO string safely
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Create timestamp object for logging
 */
export function createTimestamp() {
  return {
    timestamp: getCurrentTimestamp()
  };
}