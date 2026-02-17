/**
 * Utilidades generales del proyecto
 * 
 * Este módulo contiene funciones de utilidad compartidas,
 * principalmente para manipulación de clases CSS con Tailwind.
 * 
 * @module lib/utils
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina y fusiona clases de Tailwind CSS
 * 
 * Esta función combina clsx (para manejar arrays y objetos de clases)
 * con twMerge (para resolver conflictos de clases de Tailwind).
 * Útil para combinar clases condicionalmente sin duplicados.
 * 
 * @param {...ClassValue} inputs - Clases CSS a combinar (strings, arrays, objetos)
 * @returns {string} String de clases CSS combinadas y optimizadas
 * 
 * @example
 * ```typescript
 * import { cn } from '@/lib/utils';
 * 
 * const className = cn(
 *   'base-class',
 *   condition && 'conditional-class',
 *   { 'object-class': isActive },
 *   ['array-class']
 * );
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
