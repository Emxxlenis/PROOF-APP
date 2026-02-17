/**
 * Cliente de Supabase para el lado del cliente (browser)
 * 
 * Este módulo proporciona un cliente de Supabase configurado para usar
 * en componentes del cliente (Client Components) de Next.js.
 * 
 * @module lib/supabase/client
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea y retorna un cliente de Supabase para uso en el navegador
 * 
 * El cliente se crea usando las variables de entorno de Supabase.
 * Requiere que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
 * estén configuradas en el archivo .env.local
 * 
 * @returns {ReturnType<typeof createBrowserClient>} Cliente de Supabase configurado
 * @throws {Error} Si las variables de entorno no están configuradas
 * 
 * @example
 * ```typescript
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 * 
 * const supabase = createClient();
 * const { data } = await supabase.from('users').select('*');
 * ```
 */
export function createClient() {
  // Verificar que estamos en el navegador antes de crear el cliente
  if (typeof window === 'undefined') {
    throw new Error(
      "createClient() can only be called in the browser. " +
      "Use createClient() from '@/lib/supabase/server' for server-side code."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables are missing!\n\n" +
      "Please configure the following in .env.local:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n" +
      "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here\n\n" +
      "See SETUP.md for detailed instructions.\n" +
      "Get your credentials at: https://supabase.com/dashboard/project/_/settings/api\n\n" +
      "IMPORTANT: You need the Project URL and anon key from the API section,\n" +
      "NOT the PostgreSQL connection string."
    );
  }

  // createBrowserClient maneja automáticamente el storage (localStorage) en el navegador
  // La persistencia de sesión y duración se configuran automáticamente por Supabase
  // Para configurar duración de 7 días, ve a Supabase Dashboard > Authentication > Settings > JWT expiry
  // y configura a 604800 segundos (7 días)
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
