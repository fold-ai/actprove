"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Gamified onboarding journey (spec §14.4). Dismissable; hides at 100%. */
export function ComplianceChecklist() {
  const journey = trpc.org.journey.useQuery();
  const [dismissed, setDismissed] = useState(false);

  if (journey.isLoading || !journey.data || dismissed) return null;
  if (journey.data.complete) return null;

  const pct = Math.round((journey.data.xp / journey.data.totalXp) * 100);

  return (
    <Card className="border-brand-navy/30 bg-gradient-to-br from-secondary to-white">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand-green" />
            <span className="font-semibold">Your compliance journey</span>
            <span className="text-sm text-muted-foreground">
              {journey.data.xp} / {journey.data.totalXp} XP
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Progress value={pct} className="mb-4" indicatorClassName="bg-brand-green" />
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {journey.data.steps.map((s) => (
            <div
              key={s.key}
              className={cn(
                "flex items-center gap-2 text-sm",
                s.done ? "text-muted-foreground line-through" : "text-foreground",
              )}
            >
              {s.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              {s.label}
            </div>
          ))}
        </div>
        {pct < 100 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Earn the &quot;EU AI Act Ready&quot; badge by completing your journey.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
