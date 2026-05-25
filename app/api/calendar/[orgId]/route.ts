import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EU_AI_ACT_DEADLINES } from "@/lib/constants";

export const dynamic = "force-dynamic";

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcs(s: string) {
  return s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

/** iCal feed of compliance events. Subscribe in Google/Outlook (spec §14.3). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  const [obligations, systems] = await Promise.all([
    prisma.orgObligation.findMany({
      where: { organizationId: orgId, dueDate: { not: null } },
      include: { obligation: true },
    }),
    prisma.aiSystem.findMany({
      where: { organizationId: orgId, archived: false, nextReviewDue: { not: null } },
      select: { id: true, name: true, nextReviewDue: true },
    }),
  ]);

  const events: { uid: string; date: Date; title: string }[] = [
    ...obligations.map((o) => ({
      uid: `obl-${o.id}@actprove`,
      date: o.dueDate!,
      title: `${o.obligation.code}: ${o.obligation.title}`,
    })),
    ...systems.map((s) => ({
      uid: `rev-${s.id}@actprove`,
      date: s.nextReviewDue!,
      title: `AI system review due: ${s.name}`,
    })),
    ...EU_AI_ACT_DEADLINES.map((d, i) => ({
      uid: `deadline-${i}@actprove`,
      date: new Date(d.date),
      title: `EU AI Act: ${d.title}`,
    })),
  ];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ActProve//Compliance Calendar//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:ActProve Compliance",
    ...events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(e.date)}`,
      `SUMMARY:${escapeIcs(e.title)}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="actprove.ics"',
    },
  });
}
