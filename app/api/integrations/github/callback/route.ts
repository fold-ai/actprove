import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { logAudit } from "@/server/services/audit";

export const dynamic = "force-dynamic";

/** Step 2 of GitHub OAuth: exchange the code, encrypt + store the token. */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get("gh_oauth_state")?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/dashboard/integrations?error=${reason}`);

  if (!code || !state || state !== cookieState) return fail("github_state_mismatch");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.organizationId) return fail("no_org");

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("github_not_configured");

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL ?? origin}/api/integrations/github/callback`,
      }),
    });
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) return fail("github_token_failed");

    await prisma.integration.upsert({
      where: {
        organizationId_type: {
          organizationId: dbUser.organizationId,
          type: "github",
        },
      },
      create: {
        organizationId: dbUser.organizationId,
        type: "github",
        status: "connected",
        credentials: encrypt(token.access_token),
      },
      update: {
        status: "connected",
        credentials: encrypt(token.access_token),
      },
    });

    await logAudit({
      organizationId: dbUser.organizationId,
      userId: user.id,
      action: "integration.connected",
      resourceType: "integration",
      metadata: { type: "github", method: "oauth" },
    });

    const res = NextResponse.redirect(
      `${origin}/dashboard/integrations?connected=github`,
    );
    res.cookies.delete("gh_oauth_state");
    return res;
  } catch (err) {
    console.error("[github/callback]", err);
    return fail("github_error");
  }
}
