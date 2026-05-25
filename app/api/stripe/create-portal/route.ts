import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/server/services/stripe";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured())
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { organization: true },
  });
  if (!dbUser?.organization?.stripeCustomerId)
    return NextResponse.json({ error: "No subscription" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const session = await getStripe().billingPortal.sessions.create({
    customer: dbUser.organization.stripeCustomerId,
    return_url: `${appUrl}/dashboard/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
}
