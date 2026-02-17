/**
 * Supabase server client
 *
 * WHAT: Creates a Supabase client for Server Components, Server Actions, and
 * API routes, with cookie-based auth handling for Next.js.
 *
 * WHY: All credentials come from env (NEXT_PUBLIC_SUPABASE_*). No URLs or keys
 * are stored in code, so the repo is safe for public/portfolio use.
 *
 * @module lib/supabase/server
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea y retorna un cliente de Supabase para uso en el servidor
 * 
 * El cliente se crea usando las variables de entorno de Supabase y
 * maneja automáticamente las cookies de autenticación de Next.js.
 * Requiere que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
 * estén configuradas en el archivo .env.local
 * 
 * @returns {Promise<ReturnType<typeof createServerClient>>} Cliente de Supabase configurado
 * @throws {Error} Si las variables de entorno no están configuradas
 * 
 * @example
 * ```typescript
 * import { createClient } from '@/lib/supabase/server';
 * 
 * const supabase = await createClient();
 * const { data } = await supabase.from('users').select('*');
 * ```
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing!\n\n" +
      "Please configure the following in .env.local:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n" +
      "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here\n\n" +
      "See SETUP.md for detailed instructions.\n" +
      "Get your credentials at: https://supabase.com/dashboard/project/_/settings/api"
    );
  }

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Calcular maxAge: 7 días en segundos (604800)
            // Si Supabase ya proporciona maxAge, usarlo; si no, usar 7 días
            const maxAge = options?.maxAge || 7 * 24 * 60 * 60; // 7 días
            
            // Supabase ya configura httpOnly, secure, sameSite automáticamente
            // Solo mejoramos las opciones si no están definidas
            cookieStore.set(name, value, {
              ...options,
              // Asegurar maxAge para persistencia de sesión
              maxAge: maxAge,
              // Asegurar secure solo en producción
              ...(isProduction && !options?.secure ? { secure: true } : {}),
              // Asegurar sameSite si no está definido
              ...(!options?.sameSite ? { sameSite: 'lax' as const } : {}),
              // Asegurar path para que esté disponible en toda la app
              path: options?.path || '/',
            });
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    } as any, // Type assertion for @supabase/ssr compatibility
  });
}
