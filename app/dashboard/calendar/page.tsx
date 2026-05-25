"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EU_AI_ACT_DEADLINES } from "@/lib/constants";
import { CalendarDays, Download } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import Link from "next/link";

function bucket(dateStr: string, done: boolean) {
  if (done) return { label: "Done", cls: "bg-risk-minimal-bg text-risk-minimal" };
  const d = new Date(dateStr);
  const days = differenceInDays(d, new Date());
  if (isPast(d)) return { label: "Overdue", cls: "bg-risk-prohibited-bg text-risk-prohibited" };
  if (days <= 7) return { label: "Due soon", cls: "bg-risk-high-bg text-risk-high" };
  if (days <= 30) return { label: "Upcoming", cls: "bg-risk-limited-bg text-risk-limited" };
  return { label: "Scheduled", cls: "bg-risk-pending-bg text-risk-pending" };
}

export default function CalendarPage() {
  const events = trpc.org.calendar.useQuery();
  const current = trpc.org.current.useQuery();
  const orgId = current.data?.org.id;

  const merged = [
    ...(events.data ?? []),
    ...EU_AI_ACT_DEADLINES.map((d) => ({
      date: new Date(d.date).toISOString(),
      title: `${d.title} — ${d.what}`,
      type: "deadline" as const,
      done: false,
      link: "/dashboard/regulations",
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Compliance calendar</h2>
          <p className="text-sm text-muted-foreground">
            Obligation deadlines, system reviews, and regulatory dates.
          </p>
        </div>
        {orgId && (
          <Button asChild variant="outline">
            <a href={`/api/calendar/${orgId}`} target="_blank" rel="noopener">
              <Download className="h-4 w-4" /> Subscribe (iCal)
            </a>
          </Button>
        )}
      </div>

      {events.isLoading ? (
        <Skeleton className="h-64" />
      ) : merged.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <CalendarDays className="h-8 w-8 text-brand-navy" />
            No scheduled events yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {merged.map((e, i) => {
              const b = bucket(e.date, e.done);
              return (
                <Link
                  key={i}
                  href={e.link}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50"
                >
                  <div className="w-24 shrink-0 text-sm">
                    <div className="font-semibold text-brand-navy">
                      {format(new Date(e.date), "dd MMM")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(e.date), "yyyy")}
                    </div>
                  </div>
                  <div className="flex-1 text-sm">{e.title}</div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                      b.cls,
                    )}
                  >
                    {e.type}
                  </span>
                  <span
                    className={cn(
                      "w-20 rounded-full px-2 py-0.5 text-center text-xs font-medium",
                      b.cls,
                    )}
                  >
                    {b.label}
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
