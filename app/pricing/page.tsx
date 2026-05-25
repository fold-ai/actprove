import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS } from "@/lib/constants";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Affordable EU AI Act compliance for SMBs — $99–$499/month.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-brand-navy">
              Pricing that fits an SMB budget
            </h1>
            <p className="mt-3 text-muted-foreground">
              Comparable to Notion, Linear or Intercom — not enterprise GRC.
              Save 20% with annual billing.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PLANS.map((p) => (
              <Card
                key={p.id}
                className={
                  p.id === "growth"
                    ? "border-brand-navy ring-2 ring-brand-navy"
                    : ""
                }
              >
                <CardContent className="p-8">
                  {p.id === "growth" && (
                    <div className="mb-2 inline-block rounded-full bg-brand-navy px-2 py-0.5 text-xs font-medium text-white">
                      Most popular
                    </div>
                  )}
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <div className="my-3 text-4xl font-bold">
                    ${p.price}
                    <span className="text-base font-normal text-muted-foreground">
                      /month
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {p.systemLimit ? `Up to ${p.systemLimit} AI systems` : "Unlimited AI systems"}
                  </p>
                  <ul className="my-6 space-y-2 text-sm">
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

            {/* Business + Enterprise (sales-assisted) */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold">Business</h3>
                <div className="my-3 text-4xl font-bold">
                  $999
                  <span className="text-base font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">3 regulations, 20 users</p>
                <ul className="my-6 space-y-2 text-sm">
                  {["Everything in Team", "ISO 42001 + NIS2 frameworks", "Public API + webhooks", "White-label reports", "Partner-ready"].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/signup">Start free trial</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-brand-navy/40">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold">Enterprise</h3>
                <div className="my-3 text-4xl font-bold">
                  Custom
                  <span className="block text-sm font-normal text-muted-foreground">
                    from $3,000/month
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">200+ employees</p>
                <ul className="my-6 space-y-2 text-sm">
                  {["Unlimited everything", "Multi-subsidiary group view", "Audit mode + SCIM", "Custom integrations & SLA", "Dedicated CSM"].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full">
                  <a href="mailto:sales@actprove.com?subject=Enterprise%20enquiry">
                    Contact sales
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Self-serve plans include a 14-day free trial with full Growth access.
            No credit card required.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
