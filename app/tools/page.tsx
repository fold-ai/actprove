import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Gauge, CalendarClock, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Free EU AI Act Tools",
  description: "Free interactive tools to check your EU AI Act risk and readiness.",
};

const TOOLS = [
  { href: "/tools/risk-classifier", icon: ShieldCheck, title: "AI Risk Classifier", desc: "Find out which EU AI Act risk tier your AI system falls into." },
  { href: "/tools/compliance-score", icon: Gauge, title: "Compliance Score Calculator", desc: "Estimate your readiness with a 2-minute checklist." },
  { href: "/tools/vendor-check", icon: Search, title: "Vendor AI Compliance Checker", desc: "Check the likely risk tier of 100+ common AI tools." },
  { href: "/eu-ai-act/deadline", icon: CalendarClock, title: "Deadline Countdown", desc: "Days remaining until the August 2, 2026 deadline." },
];

export default function ToolsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold text-brand-navy">Free EU AI Act tools</h1>
        <p className="mt-3 text-muted-foreground">
          No sign-up required. Get instant answers about your AI compliance.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-2 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy text-white">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
