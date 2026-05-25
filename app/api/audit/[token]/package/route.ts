import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Generates a structured evidence package for an active audit session
 * (spec §10.3). Returns a JSON archive of register, documents, evidence and the
 * immutable audit log — everything an auditor needs in one download.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const session = await prisma.auditSession.findFirst({
    where: { token, active: true },
    include: { organization: true },
  });
  if (!session) return new NextResponse("Not found", { status: 404 });
  const orgId = session.organizationId;

  const [systems, documents, evidence, obligations, auditLog] = await Promise.all([
    prisma.aiSystem.findMany({ where: { organizationId: orgId, archived: false } }),
    prisma.complianceDocument.findMany({
      where: { organizationId: orgId, status: { not: "archived" } },
      select: { title: true, type: true, status: true, version: true, pdfUrl: true },
    }),
    prisma.evidenceFile.findMany({
      where: { organizationId: orgId },
      select: { filename: true, label: true, fileUrl: true, uploadedAt: true },
    }),
    prisma.orgObligation.findMany({
      where: { organizationId: orgId },
      include: { obligation: { include: { framework: true } } },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const pkg = {
    organization: {
      name: session.organization.name,
      country: session.organization.country,
    },
    generatedAt: new Date().toISOString(),
    auditor: session.auditorEmail,
    register: systems.map((s, i) => ({
      ref: `ORG-${String(i + 1).padStart(3, "0")}`,
      name: s.name,
      vendor: s.vendor,
      riskTier: s.riskTier,
      status: s.status,
      lastReviewedAt: s.lastReviewedAt,
    })),
    documents,
    evidence,
    obligations: obligations.map((o) => ({
      framework: o.obligation.framework.code,
      code: o.obligation.code,
      title: o.obligation.title,
      status: o.status,
    })),
    auditLog: auditLog.map((a) => ({
      action: a.action,
      at: a.createdAt,
      resource: a.resourceType,
    })),
  };

  return new NextResponse(JSON.stringify(pkg, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="ActProve-Audit-Package-${session.organization.slug}.json"`,
    },
  });
}
