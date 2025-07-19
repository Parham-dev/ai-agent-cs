'use client';

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/lib/services/auth.service';
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

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const result = await authService.initializeAuth();
      
      if (mounted) {
        setState({
          user: result.user,
          session: result.session,
          loading: false,
          error: result.error || null
        });
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (!mounted || isSigningUp) return;

        if (event === 'SIGNED_OUT' || !session) {
          setState({
            user: null,
            session: null,
            loading: false,
            error: null
          });
        } else if (event === 'SIGNED_IN' && session) {
          setState(prev => ({ ...prev, loading: true }));
          
          // Small delay to ensure database sync completes
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const result = await authService.initializeAuth();
          setState({
            user: result.user,
            session: result.session,
            loading: false,
            error: result.error || null
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
