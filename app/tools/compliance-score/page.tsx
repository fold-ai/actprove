"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreGauge } from "@/components/dashboard/score-gauge";

const CHECKS = [
  "We have a complete inventory of every AI tool we use",
  "Each AI system has a documented risk classification",
  "We've published transparency notices for customer-facing AI",
  "We have an internal AI usage policy",
  "Staff have completed AI literacy training (Article 4)",
  "We verify our AI vendors' own compliance",
  "We maintain a living register reviewed regularly",
  "We have a process for AI incidents",
];

export default function ComplianceScoreTool() {
  const [checked, setChecked] = useState<boolean[]>(Array(CHECKS.length).fill(false));
  const [submitted, setSubmitted] = useState(false);
  const score = Math.round((checked.filter(Boolean).length / CHECKS.length) * 100);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold text-brand-navy">
          Compliance Score Calculator
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tick what you&apos;ve done. We&apos;ll estimate your EU AI Act
          readiness.
        </p>

        <Card className="mt-6">
          <CardContent className="space-y-2 p-6">
            {CHECKS.map((c, i) => (
              <label key={c} className="flex items-start gap-2 rounded-md border p-2.5 text-sm">
                <Checkbox
                  checked={checked[i]}
                  onCheckedChange={(v) =>
                    setChecked((prev) => prev.map((x, j) => (j === i ? Boolean(v) : x)))
                  }
                  className="mt-0.5"
                />
                {c}
              </label>
            ))}
            <Button className="mt-2 w-full" onClick={() => setSubmitted(true)}>
              Calculate my score
            </Button>
          </CardContent>
        </Card>

        {submitted && (
          <Card className="mt-6">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <ScoreGauge value={score} label="Readiness" />
              <p className="text-sm text-muted-foreground">
                {score >= 70
                  ? "Strong start — close the remaining gaps to be audit-ready."
                  : score >= 40
                    ? "You're on your way. A few key actions will move the needle."
                    : "Time to get started — the August 2026 deadline is approaching."}
              </p>
              <Button asChild>
                <Link href="/signup">Get your personalized action plan</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
