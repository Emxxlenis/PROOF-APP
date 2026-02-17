/**
 * Utilidades para validar sesión en Server Components y API Routes
 * 
 * @module lib/auth/server
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
import type { UserProfile } from "./types";

/**
 * Obtiene la sesión actual en un Server Component o API Route
 * 
 * @returns Sesión actual o null si no hay sesión
 * 
 * @example
 * ```tsx
 * import { getServerSession } from '@/lib/auth/server';
 * 
 * export default async function MyServerComponent() {
 *   const session = await getServerSession();
 *   if (!session) redirect('/auth');
 *   
 *   return <div>Hola {session.user.email}</div>;
 * }
 * ```
 */
export async function getServerSession(): Promise<Session | null> {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting server session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error in getServerSession:', error);
    return null;
  }
}

/**
 * Obtiene el usuario actual en un Server Component o API Route
 * 
 * @returns Usuario actual o null si no hay usuario autenticado
 * 
 * @example
 * ```tsx
 * import { getServerUser } from '@/lib/auth/server';
 * 
 * export default async function MyServerComponent() {
 *   const user = await getServerUser();
 *   if (!user) redirect('/auth');
 *   
 *   return <div>Hola {user.email}</div>;
 * }
 * ```
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting server user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getServerUser:', error);
    return null;
  }
}

/**
 * Requiere autenticación y obtiene el usuario actual
 * Redirige a /auth si no hay usuario autenticado
 * 
 * @param redirectTo - Ruta a la que redirigir si no está autenticado (default: '/auth')
 * @returns Usuario autenticado (nunca retorna null, redirige si no hay usuario)
 * 
 * @example
 * ```tsx
 * import { requireAuth } from '@/lib/auth/server';
 * 
 * export default async function ProtectedComponent() {
 *   const user = await requireAuth();
 *   // user nunca es null aquí
 *   return <div>Hola {user.email}</div>;
 * }
 * ```
 */
export async function requireAuth(redirectTo: string = '/auth'): Promise<User> {
  const user = await getServerUser();
  
  if (!user) {
    redirect(redirectTo);
  }
  
  return user;
}

/**
 * Obtiene el perfil completo del usuario desde la base de datos
 * 
 * @param userId - ID del usuario (opcional, usa el usuario actual si no se proporciona)
 * @returns Perfil del usuario o null si no se encuentra
 * 
 * @example
 * ```tsx
 * import { getServerUserProfile } from '@/lib/auth/server';
 * 
 * export default async function ProfileComponent() {
 *   const profile = await getServerUserProfile();
 *   if (!profile) return <div>Perfil no encontrado</div>;
 *   
 *   return <div>{profile.full_name}</div>;
 * }
 * ```
 */
export async function getServerUserProfile(userId?: string): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const user = userId ? null : await getServerUser();
    const targetUserId = userId || user?.id;
    
    if (!targetUserId) {
      return null;
    }
    
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .single();
    
    if (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
    
    return profile as UserProfile;
  } catch (error) {
    console.error('Error in getServerUserProfile:', error);
    return null;
  }
}

/**
 * Verifica si el usuario actual tiene un rol específico
 * 
 * @param role - Rol a verificar
 * @returns true si el usuario tiene el rol, false en caso contrario
 * 
 * @example
 * ```tsx
 * import { hasRole } from '@/lib/auth/server';
 * 
 * export default async function AdminComponent() {
 *   const isAdmin = await hasRole('admin');
 *   if (!isAdmin) redirect('/dashboard');
 *   
 *   return <div>Panel de administración</div>;
 * }
 * ```
 */
export async function hasRole(role: string): Promise<boolean> {
  try {
    const profile = await getServerUserProfile();
    return profile?.role === role;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Requiere que el usuario tenga un rol específico
 * Redirige si no tiene el rol
 * 
 * @param role - Rol requerido
 * @param redirectTo - Ruta a la que redirigir si no tiene el rol (default: '/dashboard')
 * @returns Perfil del usuario con el rol requerido
 * 
 * @example
 * ```tsx
 * import { requireRole } from '@/lib/auth/server';
 * 
 * export default async function AdminComponent() {
 *   const profile = await requireRole('admin');
 *   return <div>Panel de administración</div>;
 * }
 * ```
 */
export async function requireRole(role: string, redirectTo: string = '/dashboard'): Promise<UserProfile> {
  const user = await requireAuth();
  const profile = await getServerUserProfile(user.id);
  
  if (!profile || profile.role !== role) {
    redirect(redirectTo);
  }
  
  return profile;
}






