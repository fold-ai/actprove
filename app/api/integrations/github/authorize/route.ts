import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

/** Step 1 of GitHub OAuth: redirect the user to GitHub's consent screen. */
export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/dashboard/integrations?error=github_not_configured", req.url),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const state = randomToken(16);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/integrations/github/callback`,
    scope: "read:user read:org repo",
    state,
  });

  const res = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params}`,
  );
  // CSRF state stored in an httpOnly cookie, verified on callback.
  res.cookies.set("gh_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
