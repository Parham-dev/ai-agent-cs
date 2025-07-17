// Common utility types used across the application

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Base filter interface
export interface BaseFilters extends PaginationParams {
  search?: string
}

// Generic response wrapper
export interface ServiceResponse<T> {
  data: T
  meta?: PaginationMeta
}

// Error handling types
export interface ErrorDetails {
  code: string
  message: string
  field?: string
  details?: unknown
}

// Audit/timestamp types
export interface Timestamps {
  createdAt: Date
  updatedAt: Date
}

export interface ApiTimestamps {
  createdAt: string
  updatedAt: string
}

// JSON field types (for loose typing when needed)
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export type JsonArray = JsonValue[]
export type JsonObject = { [key: string]: JsonValue }

// Utility types for Pick/Omit operations
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>

// ID types for better type safety
export type OrganizationId = string
export type AgentId = string
export type IntegrationId = string
export type AgentIntegrationId = string

// Status types
export type ActiveStatus = 'active' | 'inactive'
export type EnabledStatus = 'enabled' | 'disabled'

// This file must be a module
export {}