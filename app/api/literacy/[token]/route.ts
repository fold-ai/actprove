import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/server/services/audit";
import { sendEmail } from "@/server/services/email";

/** Records an employee's AI literacy acknowledgment (no auth — token-based). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = (await req.json()) as { name?: string };

  const record = await prisma.literacyRecord.findUnique({ where: { token } });
  if (!record) return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  if (record.status === "completed")
    return NextResponse.json({ ok: true, alreadyDone: true });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  await prisma.literacyRecord.update({
    where: { token },
    data: {
      status: "completed",
      acknowledgedAt: new Date(),
      acknowledgedIp: ip,
      name: body.name?.trim() || record.name,
    },
  });

  await logAudit({
    organizationId: record.organizationId,
    action: "literacy.acknowledged",
    resourceType: "literacy",
    resourceId: record.id,
    metadata: { name: record.name, ip },
  });

  // Notify the org owner.
  const owner = await prisma.user.findFirst({
    where: { organizationId: record.organizationId, role: "owner" },
  });
  if (owner?.email) {
    await sendEmail({
      to: owner.email,
      subject: `${record.name} completed AI literacy acknowledgment`,
      html: `<p><strong>${record.name}</strong> has confirmed their AI-related responsibilities.</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
