import Link from "next/link";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RiskBadge, StatusBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Share2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const ARTICLE_HEADERS: { label: string; article: string }[] = [
  { label: "ID", article: "" },
  { label: "System", article: "Art. 26" },
  { label: "Provider", article: "Art. 26" },
  { label: "Purpose", article: "Art. 13" },
  { label: "Risk", article: "Art. 6" },
  { label: "Data", article: "Art. 10" },
  { label: "Affects people", article: "Art. 26" },
  { label: "Oversight", article: "Art. 14" },
  { label: "Responsible", article: "Art. 4" },
  { label: "Vendor OK", article: "Art. 26.7" },
  { label: "Reviewed", article: "" },
  { label: "Status", article: "" },
];

export default async function RegisterPage() {
  const { org, orgId } = await requireOrg();
  const systems = await prisma.aiSystem.findMany({
    where: { organizationId: orgId, archived: false },
    include: { responsibleUser: true },
    orderBy: { createdAt: "asc" },
  });

  const compliant = systems.filter((s) => s.status === "compliant").length;
  const overall =
    systems.length === 0
      ? "In Progress"
      : compliant === systems.length
        ? "Compliant"
        : compliant > 0
          ? "Partially Compliant"
          : "Action Required";

  return (
    <div className="space-y-5">
      {/* Official header */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-brand-navy p-6 text-white">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="h-4 w-4" /> EU AI Act — Living Register
            </div>
            <h2 className="mt-1 text-2xl font-bold">{org.name}</h2>
            <div className="text-sm text-white/70">
              {org.country} · Last updated{" "}
              {format(new Date(org.updatedAt), "dd MMM yyyy")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase text-white/60">Overall status</div>
            <div className="text-xl font-semibold">{overall}</div>
            <div className="text-sm text-white/70">
              {systems.length} systems registered
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-4">
          <Button asChild>
            <a href="/api/register/pdf" target="_blank" rel="noopener">
              <Download className="h-4 w-4" /> Download PDF
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/trust-page">
              <Share2 className="h-4 w-4" /> Share register
            </Link>
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {ARTICLE_HEADERS.map((h) => (
                <TableHead key={h.label} className="whitespace-nowrap">
                  {h.label}
                  {h.article && (
                    <div className="text-[10px] font-normal text-muted-foreground">
                      {h.article}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {systems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="py-10 text-center text-muted-foreground">
                  No systems registered yet.{" "}
                  <Link href="/dashboard/inventory?add=1" className="underline">
                    Add your first system
                  </Link>
                  .
                </TableCell>
              </TableRow>
            ) : (
              systems.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">
                    ORG-{String(i + 1).padStart(3, "0")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/inventory/${s.id}`}
                      className="font-medium hover:underline"
                    >
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{s.vendor ?? "—"}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm">
                    {s.useCase ?? "—"}
                  </TableCell>
                  <TableCell>
                    <RiskBadge tier={s.riskTier} />
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate text-xs">
                    {s.dataProcessed.join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.affectsPeople ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.humanOversight ? "Yes" : "No"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.responsibleUser?.fullName ?? s.responsiblePerson ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.vendorCompliant == null
                      ? "?"
                      : s.vendorCompliant
                        ? "Yes"
                        : "No"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {s.lastReviewedAt
                      ? format(new Date(s.lastReviewedAt), "dd MMM yyyy")
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
