import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerApi } from "@/lib/trpc/server";
import { obligationsForTier } from "@/server/services/classifier";
import { RiskBadge } from "@/components/risk-badge";
import { SystemActions } from "@/components/inventory/system-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABEL } from "@/lib/display";
import { ArrowLeft, FileText, CheckCircle2, Circle, Paperclip } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const api = await getServerApi();

  let data;
  try {
    data = await api.aiSystems.get({ id });
  } catch {
    notFound();
  }
  const { system, audit } = data;
  const obligations = system.riskTier
    ? obligationsForTier(system.riskTier)
    : [];

  const facts: { label: string; value: string }[] = [
    { label: "Vendor", value: system.vendor ?? "—" },
    { label: "Category", value: CATEGORY_LABEL[system.category] },
    {
      label: "Data processed",
      value: system.dataProcessed.length
        ? system.dataProcessed.join(", ")
        : "—",
    },
    {
      label: "Responsible",
      value:
        system.responsibleUser?.fullName ?? system.responsiblePerson ?? "—",
    },
    {
      label: "Vendor compliant",
      value:
        system.vendorCompliant == null
          ? "Unknown"
          : system.vendorCompliant
            ? "Yes"
            : "No",
    },
    { label: "Data location", value: system.dataLocation ?? "—" },
    {
      label: "Last reviewed",
      value: system.lastReviewedAt
        ? format(new Date(system.lastReviewedAt), "dd MMM yyyy")
        : "Never",
    },
    {
      label: "Next review due",
      value: system.nextReviewDue
        ? format(new Date(system.nextReviewDue), "dd MMM yyyy")
        : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/inventory"
            className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Inventory
          </Link>
          <h2 className="text-2xl font-bold">{system.name}</h2>
          <div className="mt-1 flex items-center gap-2">
            <RiskBadge tier={system.riskTier} />
            <span className="text-sm text-muted-foreground">
              {system.vendor}
            </span>
          </div>
        </div>
        <SystemActions id={system.id} status={system.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Classification card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Risk classification
                {system.riskConfidence != null && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {Math.round(system.riskConfidence * 100)}% confidence ·{" "}
                    {system.riskClassifiedBy === "ai"
                      ? "AI-assisted"
                      : "rule-based"}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <RiskBadge tier={system.riskTier} />
                {system.internalRiskTier && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-navy/30 bg-secondary px-2.5 py-0.5 text-xs font-medium text-brand-navy">
                    Internal: {system.internalRiskLabel ?? system.internalRiskTier}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                {system.riskRationale ?? "Not yet classified."}
              </p>
              {system.riskArticles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {system.riskArticles.map((a) => (
                    <Badge key={a} variant="secondary">
                      {a}
                    </Badge>
                  ))}
                </div>
              )}
              {system.riskConfidence != null &&
                system.riskConfidence < 0.7 && (
                  <p className="rounded-md bg-risk-limited-bg p-2 text-xs text-risk-limited">
                    Confidence is low — manual review recommended.
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Obligations checklist */}
          <Card>
            <CardHeader>
              <CardTitle>What you need to do</CardTitle>
              <CardDescription>
                Obligations for this risk tier under the EU AI Act
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {obligations.map((o) => (
                  <li key={o.label} className="flex items-start gap-2 text-sm">
                    {system.status === "compliant" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-risk-minimal" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span>{o.label}</span>
                    {o.article && (
                      <Badge variant="outline" className="ml-auto shrink-0">
                        {o.article}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Description / use case */}
          {(system.description || system.useCase) && (
            <Card>
              <CardHeader>
                <CardTitle>About this system</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {system.description && (
                  <div>
                    <div className="font-medium">What it does</div>
                    <p className="text-muted-foreground">{system.description}</p>
                  </div>
                )}
                {system.useCase && (
                  <div>
                    <div className="font-medium">How we use it</div>
                    <p className="text-muted-foreground">{system.useCase}</p>
                  </div>
                )}
                {system.notes && (
                  <div>
                    <div className="font-medium">Internal notes</div>
                    <p className="text-muted-foreground">{system.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Facts */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {facts.map((f) => (
                  <div key={f.label} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{f.label}</dt>
                    <dd className="text-right font-medium capitalize">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Linked documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Linked documents</CardTitle>
            </CardHeader>
            <CardContent>
              {system.documents.length === 0 ? (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>No documents generated yet.</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/documents/new">
                      <FileText className="h-4 w-4" /> Generate
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="space-y-1 text-sm">
                  {system.documents.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={`/dashboard/documents/${d.id}`}
                        className="hover:underline"
                      >
                        {d.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evidence files</CardTitle>
            </CardHeader>
            <CardContent>
              {system.evidenceFiles.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4" /> None attached
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {system.evidenceFiles.map((e) => (
                    <li key={e.id}>{e.label ?? e.filename}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Audit trail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs">
                {audit.map((a) => (
                  <li key={a.id} className="flex justify-between gap-2">
                    <span>{a.action.replace("ai_system.", "")}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(a.createdAt), "dd MMM, HH:mm")}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
