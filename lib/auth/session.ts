/**
 * Funciones helper para manejo de sesión
 * 
 * @module lib/auth/session
 */

import { Session } from "@supabase/supabase-js";

/**
 * Configuración de sesión
 */
export const SESSION_CONFIG = {
  /** Duración de sesión: 7 días en segundos */
  SESSION_DURATION_SECONDS: 7 * 24 * 60 * 60, // 604800 segundos
  /** Refrescar sesión 5 minutos antes de expirar */
  REFRESH_BEFORE_EXPIRY_SECONDS: 5 * 60, // 300 segundos
} as const;

/**
 * Verifica si una sesión está próxima a expirar
 * 
 * @param session - Sesión de Supabase
 * @returns true si la sesión expira en menos de REFRESH_BEFORE_EXPIRY_SECONDS
 */
export function isSessionExpiringSoon(session: Session | null): boolean {
  if (!session?.expires_at) return false;
  
  const expiresAt = session.expires_at * 1000; // Convertir a milisegundos
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;
  
  return timeUntilExpiry < (SESSION_CONFIG.REFRESH_BEFORE_EXPIRY_SECONDS * 1000);
}

/**
 * Verifica si una sesión ha expirado
 * 
 * @param session - Sesión de Supabase
 * @returns true si la sesión ha expirado
 */
export function isSessionExpired(session: Session | null): boolean {
  if (!session?.expires_at) return true;
  
  const expiresAt = session.expires_at * 1000; // Convertir a milisegundos
  const now = Date.now();
  
  return now >= expiresAt;
}

/**
 * Obtiene el tiempo restante hasta la expiración de la sesión en segundos
 * 
 * @param session - Sesión de Supabase
 * @returns Tiempo restante en segundos, o 0 si no hay sesión o ha expirado
 */
export function getSessionTimeRemaining(session: Session | null): number {
  if (!session?.expires_at) return 0;
  
  const expiresAt = session.expires_at * 1000; // Convertir a milisegundos
  const now = Date.now();
  const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
  
  return timeRemaining;
}

/**
 * Verifica si una sesión necesita ser refrescada
 * 
 * @param session - Sesión de Supabase
 * @returns true si la sesión necesita refresh (está próxima a expirar o expirada)
 */
export function shouldRefreshSession(session: Session | null): boolean {
  if (!session) return false;
  
  return isSessionExpired(session) || isSessionExpiringSoon(session);
}






