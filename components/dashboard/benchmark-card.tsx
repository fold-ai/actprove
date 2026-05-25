"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

/** Industry benchmark comparison (spec §9.5). Anonymised; hidden if opted out. */
export function BenchmarkCard() {
  const q = trpc.insights.benchmark.useQuery();
  if (q.isLoading) return <Skeleton className="h-32" />;
  const d = q.data;
  if (!d || d.optedOut || !("benchmark" in d) || !d.benchmark) return null;

  const diff = d.you.score - d.benchmark.avgScore;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-brand-green" />
          How you compare
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="text-muted-foreground">
          Companies in <span className="font-medium text-foreground">{d.industry}</span>{" "}
          average a {d.benchmark.avgScore}% compliance score and{" "}
          {d.benchmark.avgSystems} AI systems.
          {d.insufficientData && " (Baseline shown — not enough peers yet.)"}
        </p>
        <p className="mt-2">
          You&apos;re at{" "}
          <span className="font-semibold text-brand-navy">{d.you.score}%</span> —{" "}
          {diff >= 0 ? (
            <span className="text-risk-minimal">{diff} pts above average.</span>
          ) : (
            <span className="text-risk-high">{Math.abs(diff)} pts below average.</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
