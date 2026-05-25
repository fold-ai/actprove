import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { COUNTRY_PAGES, getCountryPage } from "@/lib/seo/countries";
import { PRIMARY_DEADLINE, daysUntil } from "@/lib/constants";
import { Building2, Landmark, Users, ArrowRight } from "lucide-react";

export const dynamicParams = false;

export function generateStaticParams() {
  return COUNTRY_PAGES.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const c = getCountryPage(country);
  if (!c) return { title: "EU AI Act" };
  return {
    title: `EU AI Act in ${c.name} — Compliance Guide for SMBs`,
    description: `How the EU AI Act applies in ${c.name}: enforcement by ${c.authority}, key deadlines, and what SMBs must do. ${c.smbStat}`,
    alternates: { canonical: `/eu-ai-act/${c.slug}` },
  };
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const c = getCountryPage(country);
  if (!c) notFound();
  const days = daysUntil(PRIMARY_DEADLINE);

  const facts = [
    { icon: Landmark, label: "Enforcement authority", value: c.authority },
    { icon: Building2, label: "National AI strategy", value: c.strategy },
    { icon: Users, label: "Market", value: c.smbStat },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-secondary to-white">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-full bg-risk-prohibited-bg px-3 py-1 text-sm font-medium text-risk-prohibited">
              {days} days to the August 2, 2026 deadline
            </div>
            <h1 className="text-4xl font-bold text-brand-navy">
              EU AI Act in {c.name}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
              A plain-English compliance guide for {c.name} SMBs — who enforces
              it, what applies, and how to get audit-ready in under two hours.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/signup">
                {c.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <article className="mx-auto max-w-3xl px-4 py-12">
          <div className="grid gap-4 sm:grid-cols-3">
            {facts.map((f) => (
              <Card key={f.label}>
                <CardContent className="p-5">
                  <f.icon className="mb-2 h-5 w-5 text-brand-navy" />
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    {f.label}
                  </div>
                  <div className="mt-1 text-sm">{f.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-bold text-brand-navy">
            What this means in {c.name}
          </h2>
          <p className="mt-3 text-muted-foreground">{c.nuance}</p>

          <h2 className="mt-10 text-2xl font-bold text-brand-navy">
            What SMBs need to do
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>Inventory every AI tool in use.</li>
            <li>Classify each system by EU AI Act risk tier.</li>
            <li>Publish transparency notices for customer-facing AI (Article 50).</li>
            <li>Document an AI usage policy and staff AI literacy (Article 4).</li>
            <li>Keep a living register ready for {c.authority}.</li>
          </ol>

          {c.faqs.length > 0 && (
            <>
              <h2 className="mt-10 text-2xl font-bold text-brand-navy">FAQ</h2>
              <div className="mt-3 space-y-3">
                {c.faqs.map((f) => (
                  <div key={f.q} className="rounded-lg border bg-white p-4">
                    <h3 className="font-semibold">{f.q}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-12 rounded-xl bg-brand-navy p-8 text-center text-white">
            <h3 className="text-xl font-bold">Get compliant in {c.name}</h3>
            <p className="mt-2 text-white/70">
              ActProve guides you through every step — in {c.language}.
            </p>
            <Button asChild variant="brand" className="mt-4">
              <Link href="/signup">{c.cta}</Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            This guide is informational and does not constitute legal advice.
          </p>

          <div className="mt-8">
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
              Other countries
            </h3>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_PAGES.filter((x) => x.slug !== c.slug)
                .slice(0, 12)
                .map((x) => (
                  <Link
                    key={x.slug}
                    href={`/eu-ai-act/${x.slug}`}
                    className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
                  >
                    {x.name}
                  </Link>
                ))}
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
