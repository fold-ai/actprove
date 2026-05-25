import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApi, logApiUsage } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const started = Date.now();
  const ctx = await authenticateApi(req);
  if (ctx instanceof NextResponse) return ctx;

  const rows = await prisma.orgObligation.findMany({
    where: { organizationId: ctx.orgId },
    include: { obligation: { include: { framework: true } } },
  });
  await logApiUsage(ctx.apiKeyId, "/v1/compliance/obligations", "GET", 200, started);
  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      code: r.obligation.code,
      title: r.obligation.title,
      framework: r.obligation.framework.code,
      status: r.status,
      dueDate: r.dueDate,
    })),
  });
}
