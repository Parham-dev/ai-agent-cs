'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '@/lib/services/auth.service';
import { tokenProvider } from '@/lib/api/base/token-provider';
import type { User, LoginRequest, SignupRequest, AuthSession } from '@/lib/types/auth';

interface AuthState {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  const [isSigningUp, setIsSigningUp] = useState(false);
  const initializingRef = useRef(false);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        const result = await authService.initializeAuth();
        
        if (mounted) {
          setState({
            user: result.user,
            session: result.session,
            loading: false,
            error: result.error || null
          });
        }
      } finally {
        initializingRef.current = false;
      }
    };

    // Initial auth check
    initializeAuth();

    // Listen for auth changes from Supabase
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (!mounted || isSigningUp || initializingRef.current) return;

        if (event === 'SIGNED_OUT' || !session) {
          setState({
            user: null,
            session: null,
            loading: false,
            error: null
          });
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setState(prev => ({ ...prev, loading: true }));
          
          initializingRef.current = true;
          try {
            const result = await authService.initializeAuth();
            if (mounted) {
              setState({
                user: result.user,
                session: result.session,
                loading: false,
                error: result.error || null
              });
            }
          } finally {
            initializingRef.current = false;
          }
        }
      }
    );

    // Listen for cross-tab auth changes
    const unsubscribeTokenProvider = tokenProvider.onAuthChange(() => {
      if (!mounted || isSigningUp || initializingRef.current) return;
      
      // Re-initialize auth when other tabs trigger changes
      initializeAuth();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      unsubscribeTokenProvider();
    };
  }, [isSigningUp]);

  // Login function with proper state coordination
  const login = useCallback(async (credentials: LoginRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await authService.login(credentials);

      if (result.success) {
        // Let the auth state change listener handle user data update
        // Keep loading until auth context updates with user data
        return result;
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: result.error || null 
        }));
        return result;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }));
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }, []);

  // Signup function with auto-login support
  const signup = useCallback(async (credentials: SignupRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setIsSigningUp(true);

    try {
      const result = await authService.signup(credentials);

      if (result.success) {
        if (result.user && result.session) {
          // Auto-login successful - set auth state
          setState({
            user: result.user,
            session: result.session,
            loading: false,
            error: null
          });
        } else {
          // Account created but auto-login failed - clear loading
          setState(prev => ({ 
            ...prev, 
            loading: false,
            error: null
          }));
        }
      } else {
        // Signup failed
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: result.error || null 
        }));
      }

      setIsSigningUp(false);
      return result;
    } catch (error) {
      setIsSigningUp(false);
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function with complete cleanup and redirect
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await authService.logout();
      
      // Always clear state regardless of result (logout should always succeed locally)
      setState({
        user: null,
        session: null,
        loading: false,
        error: null
      });

      // Force redirect to login page after state cleanup
      if (typeof window !== 'undefined') {
        // Use timeout to ensure state is cleared before redirect
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 100);
      }

      return {
        success: true,
        message: result.message || 'Successfully logged out'
      };
    } catch (error) {
      // Even if logout fails, clear local state and redirect
      setState({
        user: null,
        session: null,
        loading: false,
        error: null
      });

      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 100);
      }

      return {
        success: true,
        error: error instanceof Error ? error.message : 'Logout completed with warnings',
        message: 'Logged out successfully'
      };
    }
  }, []);

  return {
    user: state.user,
    session: state.session,
    error: state.error,
    login,
    signup,
    logout,
    isAuthenticated: !!state.user && !!state.session,
    isLoading: state.loading,
  };
}
