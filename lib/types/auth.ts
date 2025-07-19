/**
 * Ultra-Simplified Authentication Types
 * Single source of truth with JWT metadata approach
 */

// Simple user roles
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

// Single User type - no more DbUser/ApiUser split!
export interface User {
  id: string;
  supabaseId: string;
  email: string;
  name: string | null;
  role: UserRole;
  organizationId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// JWT metadata structure (stored in Supabase app_metadata)
export interface JWTMetadata {
  organizationId: string | null;
  role: UserRole;
  userId: string; // Our internal user ID
}

// Simplified auth context - no session needed
export interface AuthContext {
  user: {
    id: string;
    supabaseId: string;
    email: string;
    name: string | null;
    role: UserRole;
    organizationId: string | null;
  };
}

// Simple session type for frontend compatibility
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Login/Signup - keep simple
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

// User creation/update
export interface CreateUserData {
  supabaseId: string;
  email: string;
  name?: string;
  role?: UserRole;
  organizationId?: string;
}

export interface UpdateUserData {
  name?: string;
  role?: UserRole;
  organizationId?: string;
  isActive?: boolean;
}

// Simple permissions - based on roles
export const PERMISSIONS = {
  SUPER_ADMIN: [
    'manage_all_organizations',
    'manage_all_users', 
    'manage_all_agents',
    'manage_all_integrations'
  ],
  ADMIN: [
    'manage_organization',
    'manage_organization_users',
    'manage_organization_agents', 
    'manage_organization_integrations'
  ],
  USER: [
    'view_organization_agents',
    'view_organization_integrations',
    'use_agents'
  ]
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][number];

// Helper to check permissions
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[role] as readonly Permission[]).includes(permission);
}

// Helper to check org access
export function canAccessOrganization(userRole: UserRole, userOrgId: string | null, targetOrgId: string): boolean {
  if (userRole === 'SUPER_ADMIN') return true;
  return userOrgId === targetOrgId;
}