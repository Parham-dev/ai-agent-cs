/**
 * Authentication & Authorization Types
 */

// User roles
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

// Database User type (with Date objects)
export interface DbUser {
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

// API User type (with string dates for JSON serialization)
export interface ApiUser {
  id: string;
  supabaseId: string;
  email: string;
  name: string | null;
  role: UserRole;
  organizationId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth session from Supabase
export interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Auth context for API requests
export interface AuthContext {
  user: ApiUser;
  session: AuthSession;
  organizationId?: string;
}

// Login/Signup request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

// Auth response types
export interface AuthResponse {
  user: ApiUser;
  session: AuthSession;
}

// User creation/update types
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

// User filters for listing
export interface UserFilters {
  organizationId?: string;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

// User permissions
export const USER_PERMISSIONS = {
  SUPER_ADMIN: [
    'manage_all_organizations',
    'manage_all_users',
    'manage_all_agents',
    'manage_all_integrations',
    'view_system_settings'
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

export type Permission = typeof USER_PERMISSIONS[keyof typeof USER_PERMISSIONS][number];

// Auth middleware types
export interface AuthenticatedRequest extends Request {
  user?: ApiUser;
  organizationId?: string;
}