import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  authenticateApi,
  logApiUsage,
  apiError,
  requireWrite,
} from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const started = Date.now();
  const ctx = await authenticateApi(req);
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;

  const system = await prisma.aiSystem.findFirst({
    where: { id, organizationId: ctx.orgId },
  });
  await logApiUsage(ctx.apiKeyId, "/v1/inventory/:id", "GET", system ? 200 : 404, started);
  if (!system) return apiError("Not found", "not_found", 404);
  return NextResponse.json({ data: system });
}

const updateSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  vendor: z.string().max(160).optional(),
  useCase: z.string().max(500).optional(),
  status: z.enum(["pending", "compliant", "needs_action", "review"]).optional(),
  responsiblePerson: z.string().max(160).optional(),
  humanOversight: z.boolean().optional(),
  logRetention: z.boolean().optional(),
  vendorCompliant: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const started = Date.now();
  const ctx = await authenticateApi(req);
  if (ctx instanceof NextResponse) return ctx;
  const writeErr = requireWrite(ctx);
  if (writeErr) return writeErr;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", "bad_request", 400);
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError("Validation failed", "bad_request", 400);

  const res = await prisma.aiSystem.updateMany({
    where: { id, organizationId: ctx.orgId },
    data: parsed.data,
  });
  if (res.count === 0) {
    await logApiUsage(ctx.apiKeyId, "/v1/inventory/:id", "PUT", 404, started);
    return apiError("Not found", "not_found", 404);
  }
  const system = await prisma.aiSystem.findUnique({ where: { id } });
  await logApiUsage(ctx.apiKeyId, "/v1/inventory/:id", "PUT", 200, started);
  return NextResponse.json({ data: system });
}
