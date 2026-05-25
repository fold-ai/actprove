import Link from "next/link";
import { requireOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/dashboard/score-gauge";
import { Progress } from "@/components/ui/progress";
import { getUnifiedScore } from "@/server/services/compliance-score";
import { ComplianceChecklist } from "@/components/dashboard/compliance-checklist";
import { BenchmarkCard } from "@/components/dashboard/benchmark-card";
import { PRIMARY_DEADLINE, daysUntil } from "@/lib/constants";
import {
  Database,
  FileText,
  ListChecks,
  Plus,
  CalendarClock,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "org.created": "Organization created",
  "ai_system.created": "Added AI system",
  "ai_system.updated": "Updated AI system",
  "ai_system.reclassified": "Re-classified AI system",
  "ai_system.reviewed": "Marked system reviewed",
  "ai_system.archived": "Archived AI system",
  "ai_system.bulk_added": "Imported AI systems",
  "document.generated": "Generated document",
  "document.regenerated": "Regenerated document",
};

export default async function DashboardHome() {
  const { user, orgId } = await requireOrg();

  const [total, compliant, needsAction, docs, byTier, recent] =
    await Promise.all([
      prisma.aiSystem.count({ where: { organizationId: orgId, archived: false } }),
      prisma.aiSystem.count({
        where: { organizationId: orgId, archived: false, status: "compliant" },
      }),
      prisma.aiSystem.count({
        where: { organizationId: orgId, archived: false, status: "needs_action" },
      }),
      prisma.complianceDocument.count({
        where: { organizationId: orgId, status: { not: "archived" } },
      }),
      prisma.aiSystem.groupBy({
        by: ["riskTier"],
        where: { organizationId: orgId, archived: false },
        _count: true,
      }),
      prisma.auditLog.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: true },
      }),
    ]);

  const unified = await getUnifiedScore(orgId);
  const health = total === 0 ? 0 : Math.round((compliant / total) * 100);
  const tierCount = (t: string) =>
    byTier.find((b) => b.riskTier === t)?._count ?? 0;
  const deadlineDays = daysUntil(PRIMARY_DEADLINE);

  const stats = [
    { label: "AI systems", value: total, icon: Database, href: "/dashboard/inventory" },
    { label: "Compliant", value: compliant, icon: ListChecks, href: "/dashboard/register" },
    { label: "Documents", value: docs, icon: FileText, href: "/dashboard/documents" },
    { label: "Needs action", value: needsAction, icon: Activity, href: "/dashboard/inventory?status=needs_action" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Welcome back{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s your EU AI Act compliance posture at a glance.
        </p>
      </div>

      <ComplianceChecklist />
      <BenchmarkCard />

      {/* Unified compliance health across frameworks */}
      {unified.frameworks.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              Unified compliance health
              <span className="text-2xl font-bold text-brand-navy">
                {unified.aggregate}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {unified.frameworks.map((f) => (
              <div key={f.code}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{f.name}</span>
                  <span className="text-muted-foreground">{f.score}%</span>
                </div>
                <Progress value={f.score} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-brand-navy">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Health score */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance health</CardTitle>
            <CardDescription>Share of systems marked compliant</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ScoreGauge value={health} />
            <div className="grid w-full grid-cols-2 gap-2 text-center text-sm">
              <div className="rounded-md bg-risk-minimal-bg p-2">
                <div className="font-semibold text-risk-minimal">
                  {tierCount("minimal_risk")}
                </div>
                <div className="text-xs">Minimal</div>
              </div>
              <div className="rounded-md bg-risk-limited-bg p-2">
                <div className="font-semibold text-risk-limited">
                  {tierCount("limited_risk")}
                </div>
                <div className="text-xs">Limited</div>
              </div>
              <div className="rounded-md bg-risk-high-bg p-2">
                <div className="font-semibold text-risk-high">
                  {tierCount("high_risk")}
                </div>
                <div className="text-xs">High risk</div>
              </div>
              <div className="rounded-md bg-risk-prohibited-bg p-2">
                <div className="font-semibold text-risk-prohibited">
                  {tierCount("prohibited")}
                </div>
                <div className="text-xs">Prohibited</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadline + quick actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-risk-high" />
              {deadlineDays} days to full enforcement
            </CardTitle>
            <CardDescription>
              EU AI Act high-risk obligations &amp; Article 50 transparency take
              effect on August 2, 2026.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Button asChild variant="outline" className="h-auto flex-col items-start gap-1 p-4">
                <Link href="/dashboard/inventory?add=1">
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Add AI system</span>
                  <span className="text-xs text-muted-foreground">
                    Catalog or manual
                  </span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto flex-col items-start gap-1 p-4">
                <Link href="/dashboard/documents/new">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Generate document</span>
                  <span className="text-xs text-muted-foreground">
                    Notices, policies
                  </span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto flex-col items-start gap-1 p-4">
                <Link href="/dashboard/register">
                  <ListChecks className="h-4 w-4" />
                  <span className="font-medium">View register</span>
                  <span className="text-xs text-muted-foreground">
                    Audit-ready
                  </span>
                </Link>
              </Button>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Recent activity</h3>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity yet. Start by adding your AI systems.
                </p>
              ) : (
                <ul className="divide-y text-sm">
                  {recent.map((log) => (
                    <li key={log.id} className="flex items-center gap-2 py-2">
                      <span className="text-foreground">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                      {(log.metadata as { name?: string } | null)?.name && (
                        <span className="text-muted-foreground">
                          · {(log.metadata as { name?: string }).name}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
