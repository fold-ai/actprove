"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, CheckCircle2, ArrowRight } from "lucide-react";

export default function FrameworksPage() {
  const available = trpc.frameworks.available.useQuery();
  const score = trpc.frameworks.score.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Regulation frameworks</h2>
        <p className="text-sm text-muted-foreground">
          EU AI Act is your primary framework. Activate others — most of the work
          is already done from data you&apos;ve entered.
        </p>
      </div>

      {/* Unified score */}
      <Card>
        <CardHeader>
          <CardTitle>Unified compliance health</CardTitle>
          <CardDescription>Weighted across all active frameworks</CardDescription>
        </CardHeader>
        <CardContent>
          {score.isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="space-y-4">
              <div className="text-4xl font-bold text-brand-navy">
                {score.data?.aggregate}%
              </div>
              <div className="space-y-3">
                {score.data?.frameworks.map((f) => (
                  <div key={f.code}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {f.name}{" "}
                        {f.primary && (
                          <Badge variant="secondary" className="ml-1">
                            Primary
                          </Badge>
                        )}
                      </span>
                      <span className="text-muted-foreground">
                        {f.score}% · {f.detail}
                      </span>
                    </div>
                    <Progress value={f.score} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available frameworks */}
      <div className="grid gap-4 md:grid-cols-2">
        {available.isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))
          : available.data?.map((f) => (
              <Card key={f.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-brand-navy">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">{f.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {f.jurisdiction} · {f.obligationCount} obligations
                        </div>
                      </div>
                    </div>
                    {f.active && (
                      <Badge className="bg-risk-minimal text-white">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                  {f.active ? (
                    <div className="space-y-2">
                      <Progress value={f.progress} />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {f.progress}% complete
                        </span>
                        <Link
                          href={`/dashboard/obligations?framework=${f.code}`}
                          className="font-medium text-brand-navy hover:underline"
                        >
                          View obligations →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/frameworks/${f.id}/activate`}>
                        Activate framework <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
