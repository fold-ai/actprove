import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/server/services/email";
import MonthlyDigest from "@/emails/monthly-digest";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Monthly digest — sent on the 1st via Vercel Cron (see vercel.json).
 * Protected by CRON_SECRET. Iterates active orgs and emails their owner.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const since = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);

  const updates = await prisma.regulationUpdate.findMany({
    where: { publishedAt: { gte: since } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const orgs = await prisma.organization.findMany({
    where: { planStatus: { in: ["active", "trialing"] } },
    include: { users: { where: { role: "owner" }, take: 1 } },
  });

  let sent = 0;
  for (const org of orgs) {
    const owner = org.users[0];
    if (!owner?.email) continue;

    const [total, compliant] = await Promise.all([
      prisma.aiSystem.count({ where: { organizationId: org.id, archived: false } }),
      prisma.aiSystem.count({
        where: { organizationId: org.id, archived: false, status: "compliant" },
      }),
    ]);
    const health = total === 0 ? 0 : Math.round((compliant / total) * 100);

    await sendEmail({
      to: owner.email,
      subject: "Your ActProve monthly compliance digest",
      react: MonthlyDigest({
        orgName: org.name,
        healthScore: health,
        updates: updates.map((u) => ({ title: u.title, summary: u.summary })),
        topActions: [
          total === 0 ? "Add your AI systems to the inventory" : "Review systems marked 'needs action'",
          "Generate or refresh your transparency notices",
          "Confirm vendor compliance for high-risk systems",
        ],
        appUrl,
      }),
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
