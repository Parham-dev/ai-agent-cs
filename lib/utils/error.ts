/**
 * Utility functions for handling errors safely in React components
 */

/**
 * Safely converts an error to a renderable string
 * Prevents "Objects are not valid as a React child" errors when rendering Error objects
 * 
 * @param error - The error to render (can be Error, string, or any value)
 * @param fallback - Fallback message if error is null/undefined
 * @returns A safe string that can be rendered in React
 */
export function renderError(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (!error) {
    return fallback
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  // For any other type, try to convert to string safely
  try {
    return String(error)
  } catch {
    return fallback
  }
}

/**
 * Gets a user-friendly error message from various error types
 * 
 * @param error - The error to extract message from
 * @param fallback - Fallback message if no message can be extracted
 * @returns A user-friendly error message
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!error) {
    return fallback
  }
  
  if (error instanceof Error) {
    return error.message || fallback
  }
  
  if (typeof error === 'string') {
    return error || fallback
  }
  
  // Check if it's an object with a message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string') {
      return message || fallback
    }
  }
  
  return fallback
}

/**
 * Type guard to check if a value is an Error object
 * 
 * @param value - The value to check
 * @returns True if the value is an Error object
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error
}