import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApi, logApiUsage } from "@/lib/api-auth";
import { htmlToPdf, registerHtml } from "@/server/services/pdf-generator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const started = Date.now();
  const ctx = await authenticateApi(req);
  if (ctx instanceof NextResponse) return ctx;

  const [org, systems] = await Promise.all([
    prisma.organization.findUnique({ where: { id: ctx.orgId } }),
    prisma.aiSystem.findMany({
      where: { organizationId: ctx.orgId, archived: false },
      include: { responsibleUser: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!org) return new NextResponse("Not found", { status: 404 });

  const html = registerHtml(
    { name: org.name, country: org.country, logoUrl: org.logoUrl, plan: org.plan },
    systems.map((s) => ({
      name: s.name,
      vendor: s.vendor,
      useCase: s.useCase,
      riskTier: s.riskTier,
      riskRationale: s.riskRationale,
      dataProcessed: s.dataProcessed,
      affectsPeople: s.affectsPeople,
      humanOversight: s.humanOversight,
      logRetention: s.logRetention,
      responsiblePerson: s.responsiblePerson,
      responsibleName: s.responsibleUser?.fullName ?? null,
      vendorCompliant: s.vendorCompliant,
      lastReviewedAt: s.lastReviewedAt,
      status: s.status,
    })),
  );

  try {
    const pdf = await htmlToPdf(html);
    await logApiUsage(ctx.apiKeyId, "/v1/register.pdf", "GET", 200, started);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="register-${org.slug}.pdf"`,
      },
    });
  } catch {
    await logApiUsage(ctx.apiKeyId, "/v1/register.pdf", "GET", 500, started);
    return new NextResponse("PDF generation failed", { status: 500 });
  }
}
