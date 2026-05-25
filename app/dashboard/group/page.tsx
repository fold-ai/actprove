"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";

export default function GroupPage() {
  const group = trpc.enterprise.group.useQuery();

  if (group.isLoading) return <Skeleton className="h-64" />;
  const g = group.data!;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Group overview</h2>
        <p className="text-sm text-muted-foreground">
          Consolidated compliance across all subsidiaries (Enterprise).
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-5 text-center">
          <div className="text-2xl font-bold">{g.subsidiaries.length}</div>
          <div className="text-xs text-muted-foreground">Subsidiaries</div>
        </CardContent></Card>
        <Card><CardContent className="p-5 text-center">
          <div className="text-2xl font-bold">{g.totalSystems}</div>
          <div className="text-xs text-muted-foreground">Total AI systems</div>
        </CardContent></Card>
        <Card><CardContent className="p-5 text-center">
          <div className="text-2xl font-bold text-brand-navy">{g.avgScore}%</div>
          <div className="text-xs text-muted-foreground">Avg compliance</div>
        </CardContent></Card>
      </div>

      {g.subsidiaries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Building2 className="h-8 w-8 text-brand-navy" />
            <p>No subsidiaries linked yet.</p>
            <p className="text-xs">
              Group accounts link multiple legal entities under one parent.
              Contact us to set up your group structure.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-3 p-5">
            {g.subsidiaries.map((s) => (
              <div key={s.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {s.name}{" "}
                    <span className="text-muted-foreground">· {s.country}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {s.systems} systems · {s.score}%
                  </span>
                </div>
                <Progress value={s.score} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
