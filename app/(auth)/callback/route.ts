// This is a Next.js Route Handler (API endpoint)
// It runs on the SERVER — never in the browser
// URL: GET /auth/callback?code=xxxxx

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Get the full URL of this request
  const requestUrl = new URL(request.url);

  // GitHub sends a temporary "code" in the URL query params
  // e.g. /auth/callback?code=abc123
  const code = requestUrl.searchParams.get("code");

  // If there's no code, something went wrong — redirect to login
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", requestUrl.origin),
    );
  }

  try {
    const supabase = await createClient();

    // Exchange the temporary code for a real session
    // Supabase handles all the OAuth token exchange internally
    // After this call, the user has a valid session stored in cookies
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL(`/login?error=${error.message}`, requestUrl.origin),
      );
    }

    // Success! Redirect to the dashboard
    // The session cookie is now set — middleware will allow access
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  } catch (err) {
    console.error("Unexpected callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=unexpected", requestUrl.origin),
    );
  }
}
