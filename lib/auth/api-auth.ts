/**
 * Helper de Autenticación para API Routes
 * 
 * Este módulo proporciona funciones helper para manejar autenticación
 * de forma consistente en todas las API routes.
 * 
 * @module lib/auth/api-auth
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../api-error-handler';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

export interface AuthResult {
  user: AuthenticatedUser;
  supabaseClient: AnySupabaseClient;
}

/**
 * Obtiene el usuario autenticado desde un request de API route
 * 
 * Intenta múltiples métodos:
 * 1. Token del header Authorization
 * 2. Cookies del request
 * 
 * @param request - NextRequest de la API route
 * @returns AuthResult con usuario y cliente Supabase autenticado
 * @throws ApiError si no se puede autenticar
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // Crear cliente Supabase base con cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // En API routes, no podemos setear cookies de respuesta
          // Las cookies se manejan automáticamente por el middleware
        },
      } as any, // Type assertion needed for @supabase/ssr v0.1.0 compatibility
    }
  );

  // Intentar obtener token del header Authorization
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  let user: AuthenticatedUser | null = null;
  let supabaseClient = supabase;

  // Método 1: Autenticación con token del header
  if (token) {
    try {
      const supabaseWithToken = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );

      const { data: { user: userFromToken }, error: tokenError } = await supabaseWithToken.auth.getUser();

      if (!tokenError && userFromToken) {
        user = {
          id: userFromToken.id,
          email: userFromToken.email,
          user_metadata: userFromToken.user_metadata,
        };
        supabaseClient = supabaseWithToken;
      }
    } catch (error) {
      // Si falla con token, intentar con cookies
    }
  }

  // Método 2: Autenticación con cookies
  if (!user) {
    const {
      data: { user: userFromCookies },
      error: cookieError,
    } = await supabase.auth.getUser();

    if (cookieError || !userFromCookies) {
      throw new ApiError(
        401,
        'Debes iniciar sesión para acceder a este recurso',
        'UNAUTHORIZED'
      );
    }

    user = {
      id: userFromCookies.id,
      email: userFromCookies.email,
      user_metadata: userFromCookies.user_metadata,
    };
  }

  if (!user) {
    throw new ApiError(
      401,
      'Debes iniciar sesión para acceder a este recurso',
      'UNAUTHORIZED'
    );
  }

  return {
    user,
    supabaseClient: supabaseClient as AnySupabaseClient,
  };
}

