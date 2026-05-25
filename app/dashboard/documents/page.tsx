"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DOC_STATUS_META } from "@/lib/display";
import { cn } from "@/lib/utils";
import { FileText, Plus, Download } from "lucide-react";
import { format } from "date-fns";

export default function DocumentsPage() {
  const list = trpc.documents.list.useQuery({});
  const docs = list.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Compliance documents</h2>
          <p className="text-sm text-muted-foreground">
            Generate audit-ready documents tailored to your AI systems.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/documents/new">
            <Plus className="h-4 w-4" /> Generate document
          </Link>
        </Button>
      </div>

      {list.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <FileText className="h-6 w-6 text-brand-navy" />
            </div>
            <h3 className="text-lg font-semibold">No documents yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Generate a transparency notice, AI usage policy, or compliance
              summary in seconds.
            </p>
            <Button asChild>
              <Link href="/dashboard/documents/new">
                <Plus className="h-4 w-4" /> Generate your first document
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => {
            const meta = DOC_STATUS_META[d.status];
            return (
              <Card key={d.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <FileText className="h-5 w-5 shrink-0 text-brand-navy" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/documents/${d.id}`}
                      className="font-medium hover:underline"
                    >
                      {d.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      v{d.version} · updated{" "}
                      {format(new Date(d.updatedAt), "dd MMM yyyy")}
                      {d.aiSystem ? ` · ${d.aiSystem.name}` : ""}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      meta.className,
                    )}
                  >
                    {meta.label}
                  </span>
                  <Button asChild variant="ghost" size="icon">
                    <a href={`/api/documents/${d.id}/pdf`} target="_blank" rel="noopener">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
