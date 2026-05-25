import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SECTOR_PAGES, getSectorPage } from "@/lib/seo/sectors";
import { Check, AlertTriangle } from "lucide-react";

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTOR_PAGES.map((s) => ({ sector: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sector: string }>;
}): Promise<Metadata> {
  const { sector } = await params;
  const s = getSectorPage(sector);
  if (!s) return { title: "EU AI Act by sector" };
  return {
    title: `${s.headline} — Compliance Guide`,
    description: s.intro,
    alternates: { canonical: `/eu-ai-act/sector/${s.slug}` },
  };
}

export default async function SectorPageView({
  params,
}: {
  params: Promise<{ sector: string }>;
}) {
  const { sector } = await params;
  const s = getSectorPage(sector);
  if (!s) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-secondary to-white">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <h1 className="text-4xl font-bold text-brand-navy">{s.headline}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
              {s.intro}
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/signup">Start free trial</Link>
            </Button>
          </div>
        </section>

        <article className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="text-2xl font-bold text-brand-navy">
            Common high-risk AI in {s.name.toLowerCase()}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.commonHighRisk.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1.5 rounded-full bg-risk-high-bg px-3 py-1 text-sm text-risk-high"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> {h}
              </span>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-bold text-brand-navy">
            Sector-specific obligations
          </h2>
          <ul className="mt-3 space-y-2">
            {s.obligations.map((o) => (
              <li key={o} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                {o}
              </li>
            ))}
          </ul>

          {s.crosswalk && (
            <Card className="mt-6 border-brand-navy/30">
              <CardContent className="p-4 text-sm">
                <strong>Crosswalk:</strong> {s.crosswalk}
              </CardContent>
            </Card>
          )}

          <div className="mt-12 rounded-xl bg-brand-navy p-8 text-center text-white">
            <h3 className="text-xl font-bold">
              ActProve&apos;s {s.name} module does this for you
            </h3>
            <p className="mt-2 text-white/70">
              Activate your sector and we apply the right risk rules and document
              templates automatically.
            </p>
            <Button asChild variant="brand" className="mt-4">
              <Link href="/signup">Start free trial</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {SECTOR_PAGES.filter((x) => x.slug !== s.slug).map((x) => (
              <Link
                key={x.slug}
                href={`/eu-ai-act/sector/${x.slug}`}
                className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
              >
                {x.name}
              </Link>
            ))}
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
