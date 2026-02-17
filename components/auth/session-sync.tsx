"use client";

/**
 * Componente que sincroniza la sesión de Supabase entre el servidor (cookies HTTP-Only)
 * y el cliente (localStorage) en todas las páginas.
 * 
 * Este componente se ejecuta silenciosamente en segundo plano para mantener
 * la sesión sincronizada cuando el usuario navega entre páginas.
 */
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function SessionSync() {
  useEffect(() => {
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return;

    const syncSession = async () => {
      try {
        const supabase = createClient();
        
        // Primero verificar si hay sesión local
        const { data: { session: localSession } } = await supabase.auth.getSession();
        
        // Si no hay sesión local, intentar sincronizar desde el servidor
        if (!localSession) {
          try {
            const response = await fetch('/api/auth/verify-session', {
              method: 'GET',
              credentials: 'include',
              headers: { 'Cache-Control': 'no-cache' },
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.verified && data.session) {
                // Sincronizar la sesión del servidor con el cliente
                // setSession guarda la sesión en localStorage y sincroniza con las cookies
                const { data: { session: syncedSession }, error: syncError } = await supabase.auth.setSession({
                  access_token: data.session.access_token,
                  refresh_token: data.session.refresh_token,
                });
                
                if (syncedSession && !syncError) {
                  // Session synced successfully - no logging needed
                } else if (syncError) {
                  // Session sync error - non-critical, handled silently
                }
              }
            }
          } catch (error) {
            // Silenciar errores de sincronización - no es crítico si falla
            console.debug('Session sync error (non-critical):', error);
          }
        } else {
          // Si hay sesión local, verificar que sigue siendo válida
          // Si está próxima a expirar, refrescarla
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = localSession.expires_at;
          
          if (expiresAt && expiresAt - now < 300) { // Menos de 5 minutos
            try {
              await supabase.auth.refreshSession();
              // Session refreshed automatically - no logging needed
            } catch (error) {
              // Session refresh error - non-critical, handled silently
            }
          }
        }
      } catch (error) {
        // Silenciar errores - no queremos interrumpir la experiencia del usuario
        console.debug('Session sync initialization error (non-critical):', error);
      }
    };

    // Sincronizar inmediatamente al montar
    syncSession();

    // También sincronizar cuando la página gana foco (usuario vuelve a la pestaña)
    const handleFocus = () => {
      syncSession();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Este componente no renderiza nada
  return null;
}

