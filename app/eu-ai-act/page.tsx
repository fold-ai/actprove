import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { COUNTRY_PAGES } from "@/lib/seo/countries";
import { SECTOR_PAGES } from "@/lib/seo/sectors";
import { COMPARISON_PAGES } from "@/lib/seo/comparisons";

export const metadata: Metadata = {
  title: "EU AI Act Guide for SMBs",
  description:
    "A plain-English guide to the EU AI Act for small and medium businesses: risk tiers, deadlines, and what you need to do.",
};

const TIERS = [
  ["Prohibited", "Banned outright — e.g. social scoring, real-time biometric surveillance.", "#C0392B"],
  ["High Risk", "Consequential decisions about people — hiring, credit, healthcare. Full obligations apply.", "#E67E22"],
  ["Limited Risk", "Chatbots and AI-generated content. Transparency obligations (Article 50).", "#D4AC0D"],
  ["Minimal Risk", "Everything else — most productivity and analytics tools. No mandatory obligations.", "#1D8348"],
];

const DATES: [string, string][] = [
  ["2 Feb 2025", "Prohibited practices banned · AI literacy (Art. 4) mandatory"],
  ["2 Aug 2025", "GPAI model rules & governance provisions apply"],
  ["2 Aug 2026", "High-risk obligations · Article 50 transparency · full enforcement"],
  ["2 Dec 2026", "AI-generated content labeling (synthetic media)"],
  ["2 Aug 2027", "AI in regulated products (medical devices, automotive)"],
];

export default function EuAiActGuide() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-4xl font-bold text-brand-navy">
            The EU AI Act, explained for SMBs
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            The EU AI Act (Regulation 2024/1689) is the world&apos;s first
            comprehensive AI law. If your company uses or builds AI in the EU
            market, it applies to you — and the main enforcement deadline is
            2 August 2026.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-brand-navy">
            The four risk tiers
          </h2>
          <div className="mt-4 space-y-3">
            {TIERS.map(([name, desc, color]) => (
              <div key={name} className="rounded-lg border bg-white p-4">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: color }}
                  />
                  <h3 className="font-semibold">{name}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-bold text-brand-navy">
            Key deadlines
          </h2>
          <ul className="mt-4 space-y-2">
            {DATES.map(([date, what]) => (
              <li key={date} className="flex gap-3 rounded-md border bg-white p-3">
                <span className="w-24 shrink-0 font-medium text-brand-navy">
                  {date}
                </span>
                <span className="text-sm text-muted-foreground">{what}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-2xl font-bold text-brand-navy">
            What most SMBs need to do
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>Inventory every AI tool you use.</li>
            <li>Classify each one by risk tier.</li>
            <li>Publish transparency notices for customer-facing AI.</li>
            <li>Document an internal AI usage policy and staff literacy.</li>
            <li>Keep a living register and review it regularly.</li>
          </ol>

          <h2 className="mt-10 text-2xl font-bold text-brand-navy">Explore by country</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {COUNTRY_PAGES.map((c) => (
              <Link
                key={c.slug}
                href={`/eu-ai-act/${c.slug}`}
                className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
              >
                {c.name}
              </Link>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-bold text-brand-navy">By sector</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {SECTOR_PAGES.map((s) => (
              <Link
                key={s.slug}
                href={`/eu-ai-act/sector/${s.slug}`}
                className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
              >
                {s.name}
              </Link>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-bold text-brand-navy">Compare &amp; learn</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {COMPARISON_PAGES.map((c) => (
              <Link
                key={c.slug}
                href={`/eu-ai-act/compare/${c.slug}`}
                className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
              >
                {c.title}
              </Link>
            ))}
            <Link href="/eu-ai-act/glossary" className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50">
              Glossary
            </Link>
          </div>

          <div className="mt-12 rounded-xl bg-brand-navy p-8 text-center text-white">
            <h3 className="text-xl font-bold">
              Get compliant in under 2 hours
            </h3>
            <p className="mt-2 text-white/70">
              ActProve walks you through every step automatically.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Button asChild variant="brand">
                <Link href="/signup">Start free trial</Link>
              </Button>
              <Button asChild variant="outline" className="bg-white">
                <Link href="/eu-ai-act/checklist">Get the free checklist</Link>
              </Button>
            </div>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            This guide is informational and does not constitute legal advice.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
