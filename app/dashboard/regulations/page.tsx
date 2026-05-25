"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { daysUntil } from "@/lib/constants";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, CalendarClock } from "lucide-react";
import { format } from "date-fns";

const ALL = "all";
const REG_LABEL: Record<string, string> = {
  eu_ai_act: "EU AI Act",
  nis2: "NIS2",
  dora: "DORA",
  iso42001: "ISO 42001",
  gdpr: "GDPR",
  cra: "CRA",
};
const SEVERITY_CLASS: Record<string, string> = {
  critical: "bg-risk-prohibited-bg text-risk-prohibited",
  high: "bg-risk-high-bg text-risk-high",
  medium: "bg-risk-limited-bg text-risk-limited",
  info: "bg-risk-pending-bg text-risk-pending",
};

export default function RegulationsPage() {
  const [regulation, setRegulation] = useState(ALL);
  const [severity, setSeverity] = useState(ALL);
  const utils = trpc.useUtils();

  const feed = trpc.regulations.feed.useQuery({
    regulation: regulation === ALL ? undefined : (regulation as never),
    severity: severity === ALL ? undefined : (severity as never),
  });
  const deadlines = trpc.regulations.deadlines.useQuery();

  const personalize = trpc.regulations.personalize.useMutation({
    onSuccess: () => utils.regulations.feed.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const markReviewed = trpc.regulations.markReviewed.useMutation({
    onSuccess: () => {
      toast.success("Marked as reviewed");
      utils.regulations.feed.invalidate();
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Regulation updates</h2>
          <div className="ml-auto flex gap-2">
            <Select value={regulation} onValueChange={setRegulation}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All regulations</SelectItem>
                {Object.entries(REG_LABEL).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {feed.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (feed.data ?? []).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No regulation updates yet. Seed the database with{" "}
              <code className="rounded bg-muted px-1">npm run db:seed</code>.
            </CardContent>
          </Card>
        ) : (
          feed.data!.map((u) => (
            <Card key={u.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{REG_LABEL[u.regulation]}</Badge>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      SEVERITY_CLASS[u.severity],
                    )}
                  >
                    {u.severity}
                  </span>
                  {u.reviewed && (
                    <Badge className="bg-risk-minimal text-white">Reviewed</Badge>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {format(new Date(u.publishedAt), "dd MMM yyyy")}
                  </span>
                </div>
                <h3 className="font-semibold">{u.title}</h3>
                <p className="text-sm text-muted-foreground">{u.summary}</p>

                {u.affectedCount > 0 && (
                  <div className="rounded-md bg-secondary p-2 text-xs">
                    Affects {u.affectedCount} of your registered systems.
                  </div>
                )}

                {u.personalizedText && (
                  <div className="rounded-md border-l-2 border-brand-navy bg-gray-50 p-3 text-sm">
                    <div className="mb-1 font-medium">How this affects you</div>
                    {u.personalizedText}
                  </div>
                )}

                <div className="flex gap-2">
                  {!u.personalizedText && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={personalize.isPending}
                      onClick={() => personalize.mutate({ updateId: u.id })}
                    >
                      <Sparkles className="h-4 w-4" /> How this affects me
                    </Button>
                  )}
                  {u.sourceUrl && (
                    <Button asChild size="sm" variant="ghost">
                      <a href={u.sourceUrl} target="_blank" rel="noopener">
                        Read full update
                      </a>
                    </Button>
                  )}
                  {!u.reviewed && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => markReviewed.mutate({ updateId: u.id })}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Mark reviewed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Deadlines timeline */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4" /> Upcoming deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(deadlines.data ?? []).map((d) => {
              const days = daysUntil(d.date);
              return (
                <div key={d.title} className="border-l-2 border-brand-navy pl-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        d.status === "urgent"
                          ? "bg-risk-prohibited"
                          : d.status === "upcoming"
                            ? "bg-risk-limited"
                            : "bg-risk-minimal",
                      )}
                    />
                    <span className="text-sm font-medium">{d.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{d.what}</div>
                  <div className="text-xs font-medium text-brand-navy">
                    {format(new Date(d.date), "d MMM yyyy")}
                    {days <= 183 && ` · ${days} days left`}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
