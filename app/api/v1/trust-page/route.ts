import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApi, logApiUsage } from "@/lib/api-auth";
import { getUnifiedScore } from "@/server/services/compliance-score";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const started = Date.now();
  const ctx = await authenticateApi(req);
  if (ctx instanceof NextResponse) return ctx;

  const [org, total, compliant, score] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { name: true, trustPageSlug: true, trustPageEnabled: true, updatedAt: true },
    }),
    prisma.aiSystem.count({ where: { organizationId: ctx.orgId, archived: false } }),
    prisma.aiSystem.count({
      where: { organizationId: ctx.orgId, archived: false, status: "compliant" },
    }),
    getUnifiedScore(ctx.orgId),
  ]);

  await logApiUsage(ctx.apiKeyId, "/v1/trust-page", "GET", 200, started);
  return NextResponse.json({
    data: {
      organization: org?.name,
      trustPageSlug: org?.trustPageSlug,
      trustPageEnabled: org?.trustPageEnabled,
      systems: total,
      complianceRate: total === 0 ? 0 : Math.round((compliant / total) * 100),
      unifiedScore: score.aggregate,
      frameworks: score.frameworks,
      lastUpdated: org?.updatedAt,
    },
  });
}
