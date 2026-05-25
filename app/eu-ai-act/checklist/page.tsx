"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

const CHECKLIST = [
  "Inventory every AI tool used across the company",
  "Identify whether you are a provider, deployer, or both",
  "Classify each system into the four EU AI Act risk tiers",
  "Document an internal AI usage policy",
  "Record AI literacy training for all staff (Article 4)",
  "Publish transparency notices for customer-facing AI (Article 50)",
  "Verify each vendor's own EU AI Act compliance (Article 26.7)",
  "Maintain a living register of all AI systems",
  "Set a review cadence per risk tier",
  "Prepare evidence for audits and client questionnaires",
];

export default function ChecklistPage() {
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <h1 className="text-3xl font-bold text-brand-navy">
            Free EU AI Act compliance checklist
          </h1>
          <p className="mt-3 text-muted-foreground">
            Ten concrete steps to get your SMB ready before the August 2026
            deadline.
          </p>

          {!unlocked ? (
            <Card className="mt-8">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm">
                  Enter your email to unlock the checklist instantly.
                </p>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (email) setUnlocked(true);
                  }}
                >
                  <Input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button type="submit">Get checklist</Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-8">
              <CardContent className="space-y-3 p-6">
                {CHECKLIST.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
                <div className="rounded-lg bg-secondary p-4 text-center">
                  <p className="text-sm font-medium">
                    Want this done automatically?
                  </p>
                  <Button asChild className="mt-2">
                    <Link href="/signup">Start free trial</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
