import { type NextRequest, NextResponse } from "next/server";
import { authenticateApi, logApiUsage } from "@/lib/api-auth";
import { getUnifiedScore } from "@/server/services/compliance-score";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const started = Date.now();
  const ctx = await authenticateApi(req);
  if (ctx instanceof NextResponse) return ctx;
  const score = await getUnifiedScore(ctx.orgId);
  await logApiUsage(ctx.apiKeyId, "/v1/compliance/score", "GET", 200, started);
  return NextResponse.json({ data: score });
}
