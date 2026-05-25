import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { RiskBadge } from "@/components/risk-badge";
import { CATEGORY_LABEL } from "@/lib/display";
import { DEFAULT_TRUST_CONFIG, type TrustPageConfig } from "@/server/routers/trust";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from "next";

export const revalidate = 300; // ISR — refresh every 5 minutes (spec §19.2.5)

async function getOrg(slug: string) {
  return prisma.organization.findFirst({
    where: { trustPageSlug: slug, trustPageEnabled: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrg(slug);
  if (!org) return { title: "Trust Page" };
  return {
    title: `${org.name} — EU AI Act Compliance`,
    description: `${org.name}'s EU AI Act compliance status, verified by ActProve.`,
  };
}

export default async function TrustPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await getOrg(slug);
  if (!org) notFound();

  const config: TrustPageConfig = {
    ...DEFAULT_TRUST_CONFIG,
    ...((org.trustPageConfig as object) ?? {}),
  };

  const systems = await prisma.aiSystem.findMany({
    where: { organizationId: org.id, archived: false },
    orderBy: { createdAt: "asc" },
  });
  const compliant = systems.filter((s) => s.status === "compliant").length;
  const rate = systems.length
    ? Math.round((compliant / systems.length) * 100)
    : 0;
  const overall =
    systems.length === 0
      ? "In Progress"
      : compliant === systems.length
        ? "Compliant"
        : compliant > 0
          ? "Partially Compliant"
          : "In Progress";

  const docs = config.showDocuments
    ? await prisma.complianceDocument.findMany({
        where: {
          organizationId: org.id,
          status: "published",
          id: config.publishedDocumentIds.length
            ? { in: config.publishedDocumentIds }
            : undefined,
        },
      })
    : [];

  const tierCount = (t: string) =>
    systems.filter((s) => s.riskTier === t).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt={org.name} className="h-10" />
            ) : (
              <span className="text-xl font-bold text-brand-navy">
                {org.name}
              </span>
            )}
            <span
              className={
                "rounded-full px-3 py-1 text-sm font-medium " +
                (overall === "Compliant"
                  ? "bg-risk-minimal-bg text-risk-minimal"
                  : overall === "Partially Compliant"
                    ? "bg-risk-limited-bg text-risk-limited"
                    : "bg-risk-pending-bg text-risk-pending")
              }
            >
              {overall}
            </span>
          </div>
          <h1 className="mt-6 text-2xl font-bold">EU AI Act Compliance Status</h1>
          <p className="text-sm text-muted-foreground">
            Status as of {format(new Date(org.updatedAt), "MMMM d, yyyy")}
          </p>
          {org.trustPageMessage && (
            <p className="mt-3 text-sm text-foreground">{org.trustPageMessage}</p>
          )}
        </div>

        {/* Summary */}
        {config.showSummary && (
          <div className="mt-6 rounded-xl border bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Compliance summary</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="AI systems" value={systems.length} />
              <Stat label="Compliance rate" value={`${rate}%`} />
              <Stat label="Minimal/Limited" value={tierCount("minimal_risk") + tierCount("limited_risk")} />
              <Stat label="High risk" value={tierCount("high_risk")} />
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "AI inventory completed",
                "Risk classifications reviewed",
                "Transparency notices available",
                `Register last updated ${format(new Date(org.updatedAt), "d MMM yyyy")}`,
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-risk-minimal" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Systems list */}
        {config.showSystems && systems.length > 0 && (
          <div className="mt-6 rounded-xl border bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">AI systems in use</h2>
            <div className="space-y-2">
              {systems.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {CATEGORY_LABEL[s.category]}
                    </div>
                  </div>
                  <RiskBadge tier={s.riskTier} />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              High-risk system details available under NDA upon request.
            </p>
          </div>
        )}

        {/* Documents */}
        {config.showDocuments && docs.length > 0 && (
          <div className="mt-6 rounded-xl border bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Published documents</h2>
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id}>
                  <a
                    href={`/api/documents/${d.id}/pdf`}
                    className="text-brand-navy-light underline"
                  >
                    {d.title} (PDF)
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Verification badge */}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border bg-white p-6 text-sm text-muted-foreground shadow-sm">
          <ShieldCheck className="h-5 w-5 text-brand-green" />
          <span>
            This compliance status is maintained using{" "}
            <a href="https://actprove.com" className="font-medium text-brand-navy">
              ActProve
            </a>
            . Last synchronized {format(new Date(org.updatedAt), "d MMM yyyy")}.
          </span>
        </div>

        <div className="mt-6 flex justify-center">
          <Logo />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-secondary p-4 text-center">
      <div className="text-2xl font-bold text-brand-navy">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
