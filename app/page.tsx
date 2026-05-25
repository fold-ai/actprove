import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS, PRIMARY_DEADLINE, daysUntil } from "@/lib/constants";
import {
  Database,
  ShieldCheck,
  FileText,
  ListChecks,
  Bell,
  Award,
  ArrowRight,
  Check,
} from "lucide-react";

const FEATURES = [
  { icon: Database, title: "AI System Inventory", desc: "A living registry of every AI tool you use — the foundation of compliance." },
  { icon: ShieldCheck, title: "Risk Classification", desc: "Automatic EU AI Act risk tiering with plain-English rationale." },
  { icon: FileText, title: "Document Generator", desc: "Transparency notices, AI usage policies and more in seconds." },
  { icon: ListChecks, title: "Living Register", desc: "Audit-ready register with EU AI Act article references and PDF export." },
  { icon: Award, title: "Trust Page & Badge", desc: "A public page and embeddable badge to prove compliance to clients." },
  { icon: Bell, title: "Regulation Monitor", desc: "Personalized alerts on changes that affect your specific systems." },
];

const STEPS = [
  ["Add systems", "Import from a catalog of 200+ tools or add custom ones."],
  ["Classify risk", "We tier each system against the four EU AI Act categories."],
  ["Generate docs", "Produce audit-ready documents tailored to your stack."],
  ["Share Trust Page", "Give clients a single link to verify your compliance."],
];

const FAQ: [string, string][] = [
  ["Who does the EU AI Act apply to?", "Any organisation that provides or deploys AI systems in the EU market — including SMBs using third-party tools like ChatGPT, CRM AI or chatbots."],
  ["What is the deadline?", "High-risk obligations and Article 50 transparency become fully enforceable on 2 August 2026. AI literacy (Article 4) has been mandatory since February 2025."],
  ["Do I need a lawyer?", "ActProve guides you through classification and documentation in plain English. For most SMBs using standard tools, that's enough — though outputs are not legal advice."],
  ["How long does setup take?", "Most teams complete their inventory, risk classification and first documents in under two hours."],
  ["Is my data secure?", "Yes. Data is isolated per organisation with row-level security, and we never store payment details — billing is handled by Stripe."],
];

export default function HomePage() {
  const days = daysUntil(PRIMARY_DEADLINE);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-secondary to-white">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-risk-prohibited-bg px-3 py-1 text-sm font-medium text-risk-prohibited">
              August 2, 2026 deadline: {days} days remaining
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-brand-navy sm:text-5xl">
              EU AI Act compliance for SMBs — without the lawyers
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              From AI inventory to audit-ready documentation, living registers,
              and client-facing Trust Pages — in under 2 hours, for less than a
              lawyer&apos;s hourly rate.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start free 14-day trial <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/eu-ai-act">Read the guide</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No credit card required.
            </p>
          </div>
        </section>

        {/* Problem / solution */}
        <section className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-brand-navy">
            The gap between free checklists and $50K enterprise tools
          </h2>
          <p className="mt-3 text-muted-foreground">
            Enterprise GRC platforms cost $20,000–$50,000+ per year. Free tools
            offer a one-time questionnaire with no ongoing value. ActProve is the
            affordable, always-up-to-date compliance hub built for 10–200 person
            companies.
          </p>
        </section>

        {/* Features */}
        <section className="bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-10 text-center text-2xl font-bold text-brand-navy">
              Everything you need to stay compliant
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Card key={f.title}>
                  <CardContent className="p-6">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy text-white">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-10 text-center text-2xl font-bold text-brand-navy">
            How it works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, desc], i) => (
              <div key={title} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-white">
                  {i + 1}
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-gray-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-10 text-center text-2xl font-bold text-brand-navy">
              Simple, transparent pricing
            </h2>
            <div className="grid gap-6 lg:grid-cols-3">
              {PLANS.map((p) => (
                <Card
                  key={p.id}
                  className={p.id === "growth" ? "border-brand-navy ring-1 ring-brand-navy" : ""}
                >
                  <CardContent className="p-6">
                    <h3 className="font-semibold">{p.name}</h3>
                    <div className="my-2 text-3xl font-bold">
                      ${p.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /mo
                      </span>
                    </div>
                    <ul className="mb-6 space-y-1.5 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      variant={p.id === "growth" ? "default" : "outline"}
                      className="w-full"
                    >
                      <Link href="/signup">Start free trial</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-brand-navy">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQ.map(([q, a]) => (
              <div key={q} className="rounded-lg border bg-white p-5">
                <h3 className="font-semibold">{q}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-navy py-16 text-center text-white">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-3xl font-bold">
              Start your compliance journey today
            </h2>
            <p className="mt-2 text-white/70">
              14-day free trial. Full Growth access. No credit card required.
            </p>
            <Button asChild size="lg" variant="brand" className="mt-6">
              <Link href="/signup">Get started free</Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
