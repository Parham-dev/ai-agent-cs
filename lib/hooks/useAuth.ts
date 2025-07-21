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

  // Login function
  const login = useCallback(async (credentials: LoginRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const result = await authService.login(credentials);

    setState(prev => ({ 
      ...prev, 
      loading: false, 
      error: result.error || null 
    }));

    return result;
  }, []);

  // Signup function
  const signup = useCallback(async (credentials: SignupRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setIsSigningUp(true);

    try {
      const result = await authService.signup(credentials);

      if (result.success && result.user && result.session) {
        // Set auth state directly for successful signup
        setState({
          user: result.user,
          session: result.session,
          loading: false,
          error: null
        });
      } else {
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

  // Logout function
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const result = await authService.logout();

    if (result.success) {
      setState({
        user: null,
        session: null,
        loading: false,
        error: null
      });
    } else {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: result.error || null 
      }));
    }

    return result;
  }, []);

  return {
    ...state,
    login,
    signup,
    logout,
    isAuthenticated: !!state.user && !!state.session,
    isLoading: state.loading,
  };
}
