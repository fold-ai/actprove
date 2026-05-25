"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function PartnerDashboardInner() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [active, setActive] = useState(params.get("code") ?? "");
  const stats = trpc.partner.stats.useQuery(
    { code: active },
    { enabled: Boolean(active) },
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold">Partner dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your referral code to view your stats.
      </p>
      <div className="mt-4 flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="your-referral-code"
        />
        <Button onClick={() => setActive(code)}>View</Button>
      </div>

      {active && stats.data && (
        <Card className="mt-6">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{stats.data.name}</div>
                <div className="text-sm capitalize text-muted-foreground">
                  {stats.data.tier} · {Math.round(stats.data.commissionRate * 100)}%
                  commission
                </div>
              </div>
              <Badge variant={stats.data.approved ? "default" : "secondary"}>
                {stats.data.approved ? "Approved" : "Pending review"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-md bg-secondary p-3">
                <div className="text-2xl font-bold">{stats.data.totalReferred}</div>
                <div className="text-xs text-muted-foreground">Referred</div>
              </div>
              <div className="rounded-md bg-secondary p-3">
                <div className="text-2xl font-bold">{stats.data.converted}</div>
                <div className="text-xs text-muted-foreground">Converted</div>
              </div>
              <div className="rounded-md bg-secondary p-3">
                <div className="text-2xl font-bold text-brand-green">
                  €{stats.data.totalEarnings.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Earnings</div>
              </div>
            </div>
            <div className="rounded-md bg-gray-900 p-3 font-mono text-xs text-gray-100">
              actprove.com/signup?ref={stats.data.referralCode}
            </div>
          </CardContent>
        </Card>
      )}
      {active && stats.data === null && (
        <p className="mt-6 text-sm text-muted-foreground">
          No partner found for that code.
        </p>
      )}
    </div>
  );
}

export default function PartnerDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Suspense>
          <PartnerDashboardInner />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
