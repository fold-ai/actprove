import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApi, logApiUsage } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const started = Date.now();
  const ctx = await authenticateApi(req);
  if (ctx instanceof NextResponse) return ctx;

  const [org, systems] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: ctx.orgId },
      select: { name: true, country: true },
    }),
    prisma.aiSystem.findMany({
      where: { organizationId: ctx.orgId, archived: false },
      orderBy: { createdAt: "asc" },
      include: { responsibleUser: { select: { fullName: true } } },
    }),
  ]);

  await logApiUsage(ctx.apiKeyId, "/v1/register", "GET", 200, started);
  return NextResponse.json({
    organization: org,
    generatedAt: new Date().toISOString(),
    systems: systems.map((s, i) => ({
      ref: `ORG-${String(i + 1).padStart(3, "0")}`,
      name: s.name,
      vendor: s.vendor,
      useCase: s.useCase,
      riskTier: s.riskTier,
      dataProcessed: s.dataProcessed,
      affectsPeople: s.affectsPeople,
      humanOversight: s.humanOversight,
      responsiblePerson: s.responsibleUser?.fullName ?? s.responsiblePerson,
      vendorCompliant: s.vendorCompliant,
      status: s.status,
      lastReviewedAt: s.lastReviewedAt,
    })),
  });
}
