import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { htmlToPdf, registerHtml } from "@/server/services/pdf-generator";
import { logAudit } from "@/server/services/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { organization: true },
  });
  if (!dbUser?.organization)
    return new NextResponse("No organization", { status: 403 });

  const systems = await prisma.aiSystem.findMany({
    where: { organizationId: dbUser.organizationId!, archived: false },
    include: { responsibleUser: true },
    orderBy: { createdAt: "asc" },
  });

  const html = registerHtml(
    {
      name: dbUser.organization.name,
      country: dbUser.organization.country,
      logoUrl: dbUser.organization.logoUrl,
      plan: dbUser.organization.plan,
    },
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
    await logAudit({
      organizationId: dbUser.organizationId!,
      userId: user.id,
      action: "register.exported",
      resourceType: "org",
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ActProve-Register-${dbUser.organization.slug}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[register/pdf]", err);
    return new NextResponse("PDF generation failed", { status: 500 });
  }
}
