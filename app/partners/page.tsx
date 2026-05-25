import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Partner Program",
  description:
    "Add EU AI Act compliance software to your advisory services. We handle the tech, you keep the relationship.",
};

const TIERS = [
  { name: "Referral Partner", who: "Individual DPOs, consultants", commission: "20% MRR for 12 months", reqs: "Self-serve sign-up" },
  { name: "Reseller Partner", who: "Law & accounting firms", commission: "30% MRR ongoing", reqs: "Partner agreement + 1 demo" },
  { name: "Strategic Partner", who: "Consulting firms, Big 4", commission: "Custom + co-marketing", reqs: "Joint go-to-market plan" },
];

export default function PartnersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-brand-navy py-16 text-center text-white">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="text-4xl font-bold">Become an ActProve partner</h1>
            <p className="mt-3 text-white/70">
              Add EU AI Act compliance software to your services. We handle the
              tech — you keep the client relationship and earn recurring
              commission.
            </p>
            <Button asChild size="lg" variant="brand" className="mt-6">
              <Link href="/partners/apply">Apply now</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((t) => (
              <Card key={t.name}>
                <CardContent className="space-y-3 p-6">
                  <h3 className="font-semibold text-brand-navy">{t.name}</h3>
                  <p className="text-sm text-muted-foreground">{t.who}</p>
                  <div className="text-lg font-bold">{t.commission}</div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                    {t.reqs}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Already a partner?{" "}
              <Link href="/partners/dashboard" className="text-brand-navy underline">
                Open your dashboard
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
