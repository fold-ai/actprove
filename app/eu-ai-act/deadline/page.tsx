import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { EU_AI_ACT_DEADLINES, PRIMARY_DEADLINE, daysUntil } from "@/lib/constants";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "EU AI Act Deadline 2026",
  description:
    "How many days until the EU AI Act enforcement deadline on August 2, 2026?",
};

export default function DeadlinePage() {
  const days = daysUntil(PRIMARY_DEADLINE);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-brand-navy py-20 text-center text-white">
          <p className="text-white/70">Until full EU AI Act enforcement</p>
          <div className="my-4 text-7xl font-bold">{days}</div>
          <p className="text-xl">days remaining</p>
          <p className="mt-2 text-white/70">August 2, 2026</p>
          <Button asChild variant="brand" size="lg" className="mt-8">
            <Link href="/signup">Start getting compliant</Link>
          </Button>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="mb-6 text-2xl font-bold text-brand-navy">
            All upcoming deadlines
          </h2>
          <div className="space-y-3">
            {EU_AI_ACT_DEADLINES.map((d) => (
              <div
                key={d.title}
                className="flex items-center gap-4 rounded-lg border bg-white p-4"
              >
                <span
                  className={
                    "h-3 w-3 shrink-0 rounded-full " +
                    (d.status === "urgent"
                      ? "bg-risk-prohibited"
                      : d.status === "upcoming"
                        ? "bg-risk-limited"
                        : "bg-risk-minimal")
                  }
                />
                <div className="flex-1">
                  <div className="font-semibold">{d.title}</div>
                  <div className="text-sm text-muted-foreground">{d.what}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium text-brand-navy">
                    {format(new Date(d.date), "d MMM yyyy")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {daysUntil(d.date)} days
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
