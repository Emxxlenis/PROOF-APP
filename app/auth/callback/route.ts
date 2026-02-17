import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(new URL("/auth?error=session_error", requestUrl.origin));
    }
    
    // El trigger debería crear el usuario automáticamente
    // Esperar un momento para que el trigger se ejecute
    if (data.session) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}







