"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RiskBadge } from "@/components/risk-badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plug, RefreshCw, CheckCircle2, X, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function IntegrationsPage() {
  const catalog = trpc.integrations.catalog.useQuery();
  const candidates = trpc.integrations.candidates.useQuery();
  const utils = trpc.useUtils();
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");

  const connect = trpc.integrations.connect.useMutation({
    onSuccess: () => {
      toast.success("Connected");
      utils.integrations.catalog.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const disconnect = trpc.integrations.disconnect.useMutation({
    onSuccess: () => utils.integrations.catalog.invalidate(),
  });
  const sync = trpc.integrations.sync.useMutation({
    onSuccess: (r) => {
      toast.success(`Sync complete · ${r.newCandidates} new candidate(s)`);
      utils.integrations.catalog.invalidate();
      utils.integrations.candidates.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const review = trpc.integrations.reviewCandidate.useMutation({
    onSuccess: () => {
      utils.integrations.candidates.invalidate();
      utils.aiSystems.list.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect your stack so ActProve discovers AI systems automatically —
          including shadow AI you haven&apos;t declared.
        </p>
      </div>

      {/* Shadow-IT candidates */}
      {(candidates.data ?? []).length > 0 && (
        <Card className="border-brand-navy/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-brand-green" />
              {candidates.data!.length} AI tool(s) discovered — review them
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.data!.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                <div className="flex-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Found via {c.discoveredVia} · {c.vendor ?? "—"}
                  </div>
                </div>
                <RiskBadge tier={c.riskTier} />
                <Button
                  size="sm"
                  onClick={() => review.mutate({ id: c.id, action: "confirm" })}
                >
                  <CheckCircle2 className="h-4 w-4" /> Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => review.mutate({ id: c.id, action: "dismiss" })}
                >
                  <X className="h-4 w-4" /> Dismiss
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* CSV import dialog */}
      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import from CSV / expenses</DialogTitle>
            <DialogDescription>
              Paste vendor names or card-statement lines. We&apos;ll match known
              AI vendors and propose them as candidates.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={6}
            placeholder={"OpenAI\nGitHub\nNotion\nMidjourney"}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
          <Button
            disabled={!csvText || connect.isPending}
            onClick={async () => {
              await connect.mutateAsync({ type: "csv", csvText });
              await sync.mutateAsync({ type: "csv" });
              setCsvOpen(false);
              setCsvText("");
            }}
          >
            Import &amp; scan
          </Button>
        </DialogContent>
      </Dialog>

      {/* Catalog grid */}
      {catalog.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.data?.map((it) => {
            const connected = it.status === "connected";
            return (
              <Card key={it.type}>
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-brand-navy">
                      <Plug className="h-5 w-5" />
                    </div>
                    {connected ? (
                      <Badge className="bg-risk-minimal text-white">Connected</Badge>
                    ) : (
                      <Badge variant="secondary">Tier {it.tier}</Badge>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{it.name}</div>
                    <p className="text-xs text-muted-foreground">{it.description}</p>
                  </div>
                  {connected && it.lastSyncAt && (
                    <p className="text-xs text-muted-foreground">
                      Last sync{" "}
                      {formatDistanceToNow(new Date(it.lastSyncAt), { addSuffix: true })}
                      {it.lastSync && ` · ${it.lastSync.newCandidates} new`}
                    </p>
                  )}
                  <div className="mt-auto flex gap-2">
                    {connected ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => sync.mutate({ type: it.type })}
                          disabled={sync.isPending}
                        >
                          <RefreshCw className={cn("h-4 w-4", sync.isPending && "animate-spin")} />
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => disconnect.mutate({ type: it.type })}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : it.authMethod === "csv" ? (
                      <Button size="sm" onClick={() => setCsvOpen(true)}>
                        Import CSV
                      </Button>
                    ) : it.type === "github" ? (
                      <Button asChild size="sm" variant="outline">
                        <a href="/api/integrations/github/authorize">
                          Connect with OAuth
                        </a>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => connect.mutate({ type: it.type })}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        OAuth connectors register the integration; configure provider
        credentials in your environment to enable live resource discovery. The
        CSV connector works offline today.
      </p>
    </div>
  );
}
