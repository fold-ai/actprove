import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { RiskBadge, StatusBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUnifiedScore } from "@/server/services/compliance-score";
import { Download, Lock } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AuditorPortal({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await prisma.auditSession.findFirst({
    where: { token, active: true },
    include: { organization: true },
  });
  if (!session) notFound();
  const orgId = session.organizationId;

  const [systems, docs, score, auditLog] = await Promise.all([
    prisma.aiSystem.findMany({
      where: { organizationId: orgId, archived: false },
      orderBy: { createdAt: "asc" },
    }),
    prisma.complianceDocument.count({
      where: { organizationId: orgId, status: "published" },
    }),
    getUnifiedScore(orgId),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
            <Lock className="h-3 w-3" /> Read-only auditor access
          </span>
        </div>

        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h1 className="text-2xl font-bold">{session.organization.name}</h1>
              <p className="text-sm text-muted-foreground">
                EU AI Act compliance package · {session.organization.country} ·
                generated {format(new Date(), "dd MMM yyyy")}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-brand-navy">
                {score.aggregate}%
              </div>
              <div className="text-xs text-muted-foreground">
                Unified compliance score
              </div>
            </div>
            <Button asChild>
              <a href={`/api/audit/${token}/package`} target="_blank" rel="noopener">
                <Download className="h-4 w-4" /> Download evidence package
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="AI systems" value={systems.length} />
          <Stat label="Published documents" value={docs} />
          <Stat
            label="Compliant"
            value={systems.filter((s) => s.status === "compliant").length}
          />
          <Stat label="Audit events" value={auditLog.length} />
        </div>

        <Card className="mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>System</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last reviewed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systems.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><RiskBadge tier={s.riskTier} /></TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell className="text-sm">
                    {s.lastReviewedAt
                      ? format(new Date(s.lastReviewedAt), "dd MMM yyyy")
                      : "Never"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 font-semibold">Tamper-evident audit log</h2>
            <ul className="space-y-1 text-xs">
              {auditLog.map((a) => (
                <li key={a.id} className="flex justify-between gap-2 border-b py-1">
                  <span>{a.action}</span>
                  <span className="text-muted-foreground">
                    {format(new Date(a.createdAt), "dd MMM yyyy, HH:mm")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-brand-navy">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
