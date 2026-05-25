import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/server/services/provisioning";

/**
 * Handles the Supabase auth redirect for email verification, magic links and
 * OAuth. Exchanges the code for a session, provisions the org/user row, then
 * routes to onboarding or the dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("redirectTo") ?? null;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let onboarded = false;
      if (user) {
        try {
          const profile = await ensureProfile(user);
          onboarded = profile?.onboarded ?? false;
        } catch (err) {
          console.error("[auth/callback] provisioning failed", err);
        }
      }

      const dest = next ?? (onboarded ? "/dashboard" : "/onboarding");
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
