import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  authenticateApi,
  logApiUsage,
  apiError,
  requireWrite,
} from "@/lib/api-auth";
import { randomToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const EVENTS = [
  "system.created",
  "system.risk_changed",
  "obligation.completed",
  "compliance_score.changed",
  "document.generated",
  "regulation.updated",
] as const;

export async function GET(req: NextRequest) {
  const started = Date.now();
  const ctx = await authenticateApi(req);
  if (ctx instanceof NextResponse) return ctx;
  const webhooks = await prisma.webhookEndpoint.findMany({
    where: { organizationId: ctx.orgId },
    select: { id: true, url: true, events: true, active: true, createdAt: true },
  });
  await logApiUsage(ctx.apiKeyId, "/v1/webhooks", "GET", 200, started);
  return NextResponse.json({ data: webhooks });
}

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(EVENTS)).min(1),
});

export async function POST(req: NextRequest) {
  const started = Date.now();
  const ctx = await authenticateApi(req);
  if (ctx instanceof NextResponse) return ctx;
  const writeErr = requireWrite(ctx);
  if (writeErr) return writeErr;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", "bad_request", 400);
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError("Validation failed", "bad_request", 400);

  const secret = randomToken(24);
  const wh = await prisma.webhookEndpoint.create({
    data: {
      organizationId: ctx.orgId,
      url: parsed.data.url,
      events: parsed.data.events,
      secret,
    },
  });
  await logApiUsage(ctx.apiKeyId, "/v1/webhooks", "POST", 201, started);
  // Secret returned once — used to verify the X-ActProve-Signature header.
  return NextResponse.json({ data: { id: wh.id, secret } }, { status: 201 });
}
