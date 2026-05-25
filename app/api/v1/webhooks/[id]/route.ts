import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  authenticateApi,
  logApiUsage,
  apiError,
  requireWrite,
} from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const started = Date.now();
  const ctx = await authenticateApi(req);
  if (ctx instanceof NextResponse) return ctx;
  const writeErr = requireWrite(ctx);
  if (writeErr) return writeErr;
  const { id } = await params;

  const res = await prisma.webhookEndpoint.deleteMany({
    where: { id, organizationId: ctx.orgId },
  });
  await logApiUsage(ctx.apiKeyId, "/v1/webhooks/:id", "DELETE", res.count ? 200 : 404, started);
  if (res.count === 0) return apiError("Not found", "not_found", 404);
  return NextResponse.json({ ok: true });
}
