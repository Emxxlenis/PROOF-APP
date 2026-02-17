/**
 * Tipos TypeScript para autenticación con Supabase
 * 
 * @module lib/auth/types
 */

import { User, Session } from "@supabase/supabase-js";

/**
 * Estado de autenticación en componentes cliente
 */
export interface AuthState {
  /** Usuario actual autenticado */
  user: User | null;
  /** Sesión actual */
  session: Session | null;
  /** Estado de carga */
  loading: boolean;
  /** Error si existe */
  error: Error | null;
}

/**
 * Retorno del hook useAuth()
 */
export interface UseAuthReturn extends AuthState {
  /** Función para cerrar sesión */
  signOut: () => Promise<void>;
  /** Función para refrescar la sesión manualmente */
  refreshSession: () => Promise<void>;
  /** Verificar si el usuario está autenticado */
  isAuthenticated: boolean;
}

/**
 * Opciones para configuración de sesión
 */
export interface SessionConfig {
  /** Duración de la sesión en días */
  sessionDurationDays: number;
  /** Tiempo antes de expirar para refrescar proactivamente (en minutos) */
  refreshBeforeExpiryMinutes: number;
}

/**
 * Datos del usuario con información adicional de la base de datos
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Respuesta de autenticación
 */
export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error?: Error | null;
}






