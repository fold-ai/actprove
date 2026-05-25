"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/risk-badge";
import { Search } from "lucide-react";

export default function VendorCheckTool() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("");
  const check = trpc.tools.vendorCheck.useQuery(
    { query: active },
    { enabled: active.length > 0 },
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold text-brand-navy">
          Is your AI tool EU AI Act compliant?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Check the likely EU AI Act risk tier of 100+ common AI tools.
        </p>

        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setActive(query);
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="e.g. HubSpot, Copilot, HireVue…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit">Check</Button>
        </form>

        {active && (
          <div className="mt-6 space-y-3">
            {check.isLoading ? (
              <p className="text-sm text-muted-foreground">Checking…</p>
            ) : (check.data?.length ?? 0) === 0 ? (
              <Card>
                <CardContent className="p-5 text-sm text-muted-foreground">
                  No match in our database. You can still classify it with the{" "}
                  <Link href="/tools/risk-classifier" className="underline">
                    risk classifier
                  </Link>
                  .
                </CardContent>
              </Card>
            ) : (
              check.data!.map((r) => (
                <Card key={r.name}>
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.vendor}
                        </div>
                      </div>
                      <RiskBadge tier={r.tier} />
                    </div>
                    <p className="text-sm text-muted-foreground">{r.rationale}</p>
                  </CardContent>
                </Card>
              ))
            )}
            <Card className="bg-secondary">
              <CardContent className="p-5 text-center">
                <p className="text-sm font-medium">
                  Track every tool&apos;s compliance automatically
                </p>
                <Button asChild className="mt-2">
                  <Link href="/signup">Start free trial</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        <p className="mt-6 text-xs text-muted-foreground">
          Risk tiers are indicative and depend on how you use the tool — not a
          legal determination.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
