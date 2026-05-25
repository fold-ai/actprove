"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PLANS, type PlanId } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, ShieldCheck } from "lucide-react";

function BillingInner() {
  const params = useSearchParams();
  const current = trpc.org.current.useQuery();
  const [loading, setLoading] = useState<string | null>(null);

  const org = current.data?.org;

  async function checkout(plan: PlanId) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? "Could not start checkout");
      }
    } catch {
      toast.error("Could not start checkout");
    } finally {
      setLoading(null);
    }
  }

  async function portal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/create-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error ?? "No active subscription");
    } finally {
      setLoading(null);
    }
  }

  if (current.isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Billing &amp; plan</h2>
        <p className="text-sm text-muted-foreground">
          {org?.planStatus === "trialing"
            ? "You're on a free trial with full Growth access."
            : `Current plan: ${org?.plan} (${org?.planStatus})`}
        </p>
      </div>

      {params.get("checkout") === "cancelled" && (
        <div className="rounded-md bg-risk-limited-bg p-3 text-sm text-risk-limited">
          Checkout was cancelled. You can pick a plan whenever you&apos;re ready.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = org?.plan === p.id && org?.planStatus === "active";
          return (
            <Card
              key={p.id}
              className={cn(
                p.id === "growth" && "border-brand-navy ring-1 ring-brand-navy",
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-green" />
                  {p.name}
                </CardTitle>
                <div className="text-3xl font-bold">
                  ${p.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={p.id === "growth" ? "default" : "outline"}
                  disabled={isCurrent || loading === p.id}
                  onClick={() => checkout(p.id)}
                >
                  {isCurrent
                    ? "Current plan"
                    : loading === p.id
                      ? "Redirecting…"
                      : `Choose ${p.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <div className="font-medium">Manage subscription</div>
            <div className="text-sm text-muted-foreground">
              Update payment method, download invoices, or cancel.
            </div>
          </div>
          <Button variant="outline" onClick={portal} disabled={loading === "portal"}>
            Open customer portal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <BillingInner />
    </Suspense>
  );
}
