import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What's new in ActProve — product updates and feature releases.",
};

const ENTRIES: { date: string; tag: string; title: string; items: string[] }[] = [
  {
    date: "2026-05-24",
    tag: "Platform",
    title: "Multi-regulation, integrations, API & advisor",
    items: [
      "ISO 42001, NIS2 and DORA frameworks with gap analysis and an obligations Kanban",
      "Integration marketplace with shadow-IT discovery (GitHub OAuth, CSV import)",
      "Public REST API + webhooks and a developer docs page",
      "AI Compliance Advisor chat grounded in the EU AI Act and your own systems",
      "Command palette (⌘K), compliance calendar, in-app notifications",
      "27 country pages, sector & comparison guides, glossary and free tools",
    ],
  },
  {
    date: "2026-05-10",
    tag: "MVP",
    title: "ActProve launches",
    items: [
      "AI system inventory with automatic EU AI Act risk classification",
      "Living register with audit-ready PDF export",
      "Document generator (transparency notices, AI usage policy, and more)",
      "Public Trust Page and embeddable compliance badge",
      "Stripe billing with a 14-day free trial",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-4xl font-bold text-brand-navy">Changelog</h1>
        <p className="mt-3 text-muted-foreground">
          Product updates, newest first.
        </p>

        <div className="mt-10 space-y-10 border-l-2 border-secondary pl-6">
          {ENTRIES.map((e) => (
            <div key={e.date} className="relative">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-brand-navy" />
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{e.tag}</Badge>
                <span className="text-sm text-muted-foreground">{e.date}</span>
              </div>
              <h2 className="mt-1 text-xl font-bold">{e.title}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {e.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
