/**
 * Session Verification API Route
 *
 * Verifies that session cookies are properly established on the server.
 * Used after login to ensure cookie synchronization before redirecting.
 *
 * @module app/api/auth/verify-session
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Verifies server-side session state.
 *
 * Uses getSession() first (more tolerant of sync delays),
 * falls back to getUser() if session unavailable but user exists.
 *
 * @route GET /api/auth/verify-session
 *
 * @returns JSON with verification status and session data
 *
 * @example
 * Success response:
 * ```json
 * {
 *   "verified": true,
 *   "user": { "id": "...", "email": "..." },
 *   "session": { "access_token": "...", ... }
 * }
 * ```
 *
 * Failure response:
 * ```json
 * {
 *   "verified": false,
 *   "error": "No hay sesión activa",
 *   "user": null,
 *   "session": null
 * }
 * ```
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // getSession() is more tolerant during sync delays than getUser()
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      // Fallback: try getUser() if session unavailable
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return NextResponse.json({
          verified: true,
          user: {
            id: user.id,
            email: user.email,
          },
          session: null,
        }, { headers: { 'Cache-Control': 'no-cache' } });
      }

      logger.error('Session verification failed', error as Error);
      return NextResponse.json(
        {
          verified: false,
          error: error.message,
          user: null,
          session: null
        },
        { status: 401, headers: { 'Cache-Control': 'no-cache' } }
      );
    }

    if (session?.user) {
      // Return session data for client synchronization
      return NextResponse.json({
        verified: true,
        user: {
          id: session.user.id,
          email: session.user.email,
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: {
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
          },
        },
      }, { headers: { 'Cache-Control': 'no-cache' } });
    }

    return NextResponse.json(
      {
        verified: false,
        error: 'No hay sesión activa',
        user: null,
        session: null
      },
      { status: 401, headers: { 'Cache-Control': 'no-cache' } }
    );
  } catch (error: any) {
    logger.error('Unexpected session verification error', error as Error);
    return NextResponse.json(
      {
        verified: false,
        error: error.message || 'Error desconocido',
        user: null,
        session: null
      },
      { status: 500, headers: { 'Cache-Control': 'no-cache' } }
    );
  }
}
