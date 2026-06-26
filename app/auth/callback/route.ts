// This is a Next.js Route Handler (API endpoint)
// It runs on the SERVER — never in the browser
// URL: GET /auth/callback?code=xxxxx

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", requestUrl.origin),
    );
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL(`/login?error=${error.message}`, requestUrl.origin),
      );
    }

    // Save the GitHub access token to our profiles table
    // provider_token is ONLY available right here after the OAuth exchange
    // This is the only place we can reliably capture it
    if (data.session?.provider_token && data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          github_access_token: data.session.provider_token,
          github_username: data.user.user_metadata?.user_name ?? null,
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      );

      if (profileError) {
        console.error("Failed to save GitHub token:", profileError);
      }
    }

    return NextResponse.redirect(new URL("/", requestUrl.origin));
  } catch (err) {
    console.error("Unexpected callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=unexpected", requestUrl.origin),
    );
  }
}
