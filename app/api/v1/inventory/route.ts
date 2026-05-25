import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  authenticateApi,
  logApiUsage,
  apiError,
  requireWrite,
} from "@/lib/api-auth";
import { classify, reviewCadenceMonths } from "@/server/services/classifier";
import { applySectorOverride } from "@/server/services/sector-rules";
import { emitEvent } from "@/server/services/webhooks";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(160),
  vendor: z.string().max(160).optional(),
  category: z
    .enum(["crm", "chatbot", "hr", "analytics", "content", "code", "other"])
    .default("other"),
  description: z.string().max(500).optional(),
  useCase: z.string().max(500).optional(),
  dataProcessed: z.array(z.string()).default([]),
  affectsEmployment: z.boolean().default(false),
  affectsCredit: z.boolean().default(false),
  affectsHealthcare: z.boolean().default(false),
  isPublicFacing: z.boolean().default(false),
  hasChatbotUi: z.boolean().default(false),
  generatesContent: z.boolean().default(false),
  isRealtimeBiometric: z.boolean().default(false),
});

function nextReview(tier: string): Date | null {
  const m = reviewCadenceMonths(tier as never);
  if (m === 0) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d;
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const ctx = await authenticateApi(req);
  if (ctx instanceof NextResponse) return ctx;

  const { searchParams } = req.nextUrl;
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50));
  const offset = Number(searchParams.get("offset") ?? 0);

  const [items, total] = await Promise.all([
    prisma.aiSystem.findMany({
      where: { organizationId: ctx.orgId, archived: false },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        vendor: true,
        category: true,
        riskTier: true,
        status: true,
        lastReviewedAt: true,
      },
    }),
    prisma.aiSystem.count({ where: { organizationId: ctx.orgId, archived: false } }),
  ]);

  await logApiUsage(ctx.apiKeyId, "/v1/inventory", "GET", 200, started);
  return NextResponse.json({ data: items, pagination: { total, limit, offset } });
}

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
  if (!parsed.success) {
    return apiError("Validation failed", "bad_request", 400);
  }
  const input = parsed.data;

  const org = await prisma.organization.findUnique({
    where: { id: ctx.orgId },
    select: { sector: true },
  });
  const classifierInput = {
    ...input,
    description: input.description ?? null,
    useCase: input.useCase ?? null,
    affectsPeople:
      input.affectsEmployment || input.affectsCredit || input.affectsHealthcare,
    hidesAiNature: false,
  };
  const result =
    applySectorOverride(classifierInput, org?.sector) ?? classify(classifierInput);

  const system = await prisma.aiSystem.create({
    data: {
      organizationId: ctx.orgId,
      name: input.name,
      vendor: input.vendor,
      category: input.category,
      description: input.description,
      useCase: input.useCase,
      dataProcessed: input.dataProcessed,
      affectsPeople: classifierInput.affectsPeople,
      affectsEmployment: input.affectsEmployment,
      affectsCredit: input.affectsCredit,
      affectsHealthcare: input.affectsHealthcare,
      isPublicFacing: input.isPublicFacing,
      hasChatbotUi: input.hasChatbotUi,
      generatesContent: input.generatesContent,
      isRealtimeBiometric: input.isRealtimeBiometric,
      riskTier: result.tier,
      riskRationale: result.rationale,
      riskArticles: result.articles,
      riskConfidence: result.confidence,
      riskClassifiedBy: result.classifiedBy,
      nextReviewDue: nextReview(result.tier),
    },
  });

  void emitEvent(ctx.orgId, "system.created", {
    id: system.id,
    name: system.name,
    riskTier: result.tier,
    source: "api",
  });
  await logApiUsage(ctx.apiKeyId, "/v1/inventory", "POST", 201, started);
  return NextResponse.json({ data: system }, { status: 201 });
}
