import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { htmlToPdf } from "@/server/services/pdf-generator";
import { documentPdfHtml } from "@/server/services/document-generator";
import { logAudit } from "@/server/services/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

  const doc = await prisma.complianceDocument.findFirst({
    where: { id, organizationId: dbUser.organizationId! },
  });
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const html = documentPdfHtml(
    { name: dbUser.organization.name, country: dbUser.organization.country },
    doc.title,
    doc.contentHtml ?? "<p>(empty)</p>",
  );

  try {
    const pdf = await htmlToPdf(html);
    await logAudit({
      organizationId: dbUser.organizationId!,
      userId: user.id,
      action: "document.pdf_generated",
      resourceType: "document",
      resourceId: doc.id,
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${doc.title.replace(/[^a-z0-9]+/gi, "-")}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[documents/pdf]", err);
    return new NextResponse("PDF generation failed", { status: 500 });
  }
}
