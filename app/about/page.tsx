import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About ActProve",
  description:
    "ActProve is the EU AI Act compliance operations platform for SMBs — affordable, always up to date, and built for the August 2026 deadline.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-4xl font-bold text-brand-navy">Our mission</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Every European SMB now has to comply with the EU AI Act — but the tools
          built for it cost $20,000–$50,000 a year and take months to deploy.
          ActProve exists to close that gap: audit-ready AI compliance for the
          price of a normal SaaS subscription, set up in under two hours.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-brand-navy">Why now</h2>
        <p className="mt-3 text-muted-foreground">
          The EU AI Act&apos;s main enforcement deadline is 2 August 2026, yet
          most in-scope businesses haven&apos;t started. We believe compliance
          shouldn&apos;t require a legal team — just a clear, structured workflow
          that stays current as the regulation evolves.
        </p>

        <h2 className="mt-10 text-2xl font-bold text-brand-navy">What we believe</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Compliance should be operational, not a one-time PDF.</li>
          <li>Evidence should speak for itself when a regulator knocks.</li>
          <li>AI outputs must always be explainable and human-reviewable.</li>
          <li>Affordable beats enterprise-grade gatekeeping.</li>
        </ul>

        <div className="mt-12 rounded-xl bg-brand-navy p-8 text-center text-white">
          <h3 className="text-xl font-bold">Join us before the deadline</h3>
          <Button asChild variant="brand" className="mt-4">
            <Link href="/signup">Start free trial</Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          ActProve provides software, not legal advice.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
