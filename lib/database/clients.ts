// Database clients - Prisma and Supabase
import { createClient } from '@supabase/supabase-js'

// Re-export Prisma client
export { prisma } from './database'

// Server-side Supabase client factory (lazy initialization)
export function createServerSupabaseClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Server Supabase client should not be used on the client side')
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for server client')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Client-side Supabase client factory (lazy initialization)
export function createClientSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase environment variables for client')
  }

  return createClient(supabaseUrl, anonKey)
}