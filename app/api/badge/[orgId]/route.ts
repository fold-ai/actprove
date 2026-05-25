import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Dynamic SVG compliance badge (spec §8.3.3). Cached for 1 hour. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { trustPageEnabled: true },
  });

  const systems = org
    ? await prisma.aiSystem.findMany({
        where: { organizationId: orgId, archived: false },
        select: { status: true },
      })
    : [];

  const total = systems.length;
  const compliant = systems.filter((s) => s.status === "compliant").length;
  const status =
    total > 0 && compliant === total
      ? { label: "Compliant", color: "#1D8348" }
      : compliant > 0
        ? { label: "Partial", color: "#D4AC0D" }
        : { label: "In Progress", color: "#85929E" };

  const updated = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60" role="img" aria-label="EU AI Act ${status.label} — Verified by ActProve">
  <rect width="180" height="60" rx="6" fill="#1B4F72"/>
  <g transform="translate(12,15)">
    <path d="M9 0L18 3v6c0 5-3.9 8.5-9 11C3.9 17.5 0 14 0 9V3L9 0z" fill="#fff" opacity="0.95"/>
    <path d="M5 9l3 3 5-6" stroke="#1B4F72" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="40" y="24" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="12" font-weight="bold">EU AI Act</text>
  <rect x="40" y="30" width="${Math.max(58, status.label.length * 7)}" height="15" rx="7" fill="${status.color}"/>
  <text x="${40 + Math.max(58, status.label.length * 7) / 2}" y="41" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="10" font-weight="bold" text-anchor="middle">${status.label}</text>
  <text x="40" y="55" fill="#ffffff99" font-family="Arial,Helvetica,sans-serif" font-size="7">Verified by ActProve · ${updated}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
