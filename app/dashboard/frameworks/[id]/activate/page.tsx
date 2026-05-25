"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Circle, Sparkles } from "lucide-react";

export default function ActivateFrameworkPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const gap = trpc.frameworks.gapAnalysis.useQuery({ frameworkId: id });
  const activate = trpc.frameworks.activate.useMutation({
    onSuccess: () => {
      toast.success("Framework activated");
      router.push(`/dashboard/obligations?framework=${gap.data?.framework.code}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (gap.isLoading) return <Skeleton className="h-96" />;
  if (!gap.data) return <p>Framework not found.</p>;
  const g = gap.data;

  const STEPS = ["Overview", "Gap analysis", "Obligations"];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/dashboard/frameworks"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Frameworks
      </Link>

      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={cn(
                "h-1.5 rounded-full",
                i <= step ? "bg-brand-navy" : "bg-gray-200",
              )}
            />
            <span className="mt-1 block text-xs text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          {step === 0 && (
            <>
              <h2 className="text-xl font-bold">{g.framework.name}</h2>
              <p className="text-sm text-muted-foreground">
                {g.framework.description}
              </p>
              <div className="rounded-md bg-secondary p-4 text-sm">
                {g.total} obligations · {g.framework.code.toUpperCase()}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(1)}>Continue</Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-bold">Data gap analysis</h2>
              <div className="rounded-lg bg-risk-minimal-bg p-4 text-center">
                <div className="text-4xl font-bold text-risk-minimal">
                  {g.reusePercent}%
                </div>
                <p className="text-sm text-risk-minimal">
                  already covered by your EU AI Act data ({g.reuseCount} of{" "}
                  {g.total} obligations pre-filled)
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Activating this framework reuses your existing inventory, risk
                classifications, and documents — you only need to complete the
                remaining {g.total - g.reuseCount} obligations.
              </p>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setStep(2)}>See obligations</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold">Obligations to import</h2>
              <div className="max-h-80 space-y-1.5 overflow-y-auto">
                {g.obligations.map((o) => (
                  <div
                    key={o.code}
                    className="flex items-center gap-2 rounded-md border p-2 text-sm"
                  >
                    {o.prefilled ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-risk-minimal" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="font-mono text-xs text-muted-foreground">
                      {o.code}
                    </span>
                    <span className="flex-1">{o.title}</span>
                    {o.prefilled && (
                      <Badge variant="secondary" className="text-xs">
                        Pre-filled
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => activate.mutate({ frameworkId: id })}
                  disabled={activate.isPending}
                >
                  <Sparkles className="h-4 w-4" />
                  {activate.isPending ? "Activating…" : "Activate framework"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
