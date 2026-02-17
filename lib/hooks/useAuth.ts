/**
 * Authentication Hook
 *
 * Client-side hook for managing user authentication state.
 * Provides session access, sign out functionality, and automatic state updates.
 *
 * @remarks
 * - Initializes Supabase client only in browser environment
 * - Syncs with HTTP-only session cookies via verify-session API
 * - Listens for auth state changes automatically
 *
 * @module lib/hooks/useAuth
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { UseAuthReturn } from "@/lib/auth/types";

/**
 * Hook for accessing authentication state and methods.
 *
 * @returns Object containing user, session, loading state, error, and auth methods
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useAuth } from '@/lib/hooks/useAuth';
 *
 * export default function ProfilePage() {
 *   const { user, loading, signOut, isAuthenticated } = useAuth();
 *
 *   if (loading) return <Spinner />;
 *   if (!isAuthenticated) return <Redirect to="/auth" />;
 *
 *   return (
 *     <div>
 *       <p>Hello, {user.email}</p>
 *       <button onClick={signOut}>Sign out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  // Initialize client only in browser (client component safety)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setSupabase(createClient());
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error initializing Supabase client'));
        setLoading(false);
      }
    }
  }, []);

  /**
   * Loads session from Supabase client with refresh fallback.
   */
  const loadSession = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        // Attempt session refresh on error
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          throw refreshError;
        }

        setSession(refreshedSession);
        setUser(refreshedSession?.user ?? null);
      } else {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error loading session');
      setError(error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initialize session and subscribe to auth changes
  useEffect(() => {
    if (!supabase) return;

    const initializeSession = async () => {
      try {
        // Try local session first (localStorage)
        const { data: { session: localSession }, error: sessionError } = await supabase.auth.getSession();

        if (localSession && !sessionError) {
          setSession(localSession);
          setUser(localSession.user);
          setLoading(false);
        } else {
          // Sync with server cookies via verify-session API
          try {
            const response = await fetch('/api/auth/verify-session', {
              method: 'GET',
              credentials: 'include',
              headers: { 'Cache-Control': 'no-cache' },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.verified && data.session) {
                const { data: { session: syncedSession }, error: syncError } = await supabase.auth.setSession({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
                });

                if (syncedSession && !syncError) {
                  setSession(syncedSession);
                  setUser(syncedSession.user);
                  setLoading(false);
                  return;
                }
              }
            }
          } catch {
            // Session sync errors are non-critical, proceed with normal load
          }

          loadSession();
        }
      } catch {
        loadSession();
      }
    };

    initializeSession();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      setError(null);

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadSession]);

  /**
   * Signs out the current user and redirects to /auth.
   * @throws Error if sign out fails
   */
  const signOut = useCallback(async () => {
    if (!supabase) return;

    try {
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      setSession(null);
      setUser(null);
      router.push('/auth');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error signing out');
      setError(error);
      throw error;
    }
  }, [supabase, router]);

  /**
   * Manually refreshes the current session.
   * @throws Error if refresh fails
   */
  const refreshSession = useCallback(async () => {
    if (!supabase) return;

    try {
      setError(null);
      setLoading(true);

      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        throw refreshError;
      }

      setSession(refreshedSession);
      setUser(refreshedSession?.user ?? null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error refreshing session');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return {
    user,
    session,
    loading,
    error,
    signOut,
    refreshSession,
    isAuthenticated: !!user && !!session,
  };
}
