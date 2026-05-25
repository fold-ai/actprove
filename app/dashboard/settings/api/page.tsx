"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Copy, Key, Webhook, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function ApiSettingsPage() {
  const keys = trpc.api.list.useQuery();
  const webhooks = trpc.api.webhooks.useQuery();
  const events = trpc.api.events.useQuery();
  const utils = trpc.useUtils();

  const [keyName, setKeyName] = useState("");
  const [perm, setPerm] = useState<"read" | "read_write">("read");
  const [newToken, setNewToken] = useState<string | null>(null);

  const createKey = trpc.api.create.useMutation({
    onSuccess: (r) => {
      setNewToken(r.token);
      setKeyName("");
      utils.api.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const revoke = trpc.api.revoke.useMutation({
    onSuccess: () => utils.api.list.invalidate(),
  });

  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const createWebhook = trpc.api.createWebhook.useMutation({
    onSuccess: (r) => {
      setNewSecret(r.secret);
      setWebhookUrl("");
      setSelectedEvents([]);
      utils.api.webhooks.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteWebhook = trpc.api.deleteWebhook.useMutation({
    onSuccess: () => utils.api.webhooks.invalidate(),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">API &amp; webhooks</h2>
        <p className="text-sm text-muted-foreground">
          Programmatic access to your compliance data (Team plan and above).{" "}
          <a href="/developers" className="text-brand-navy underline">
            Read the docs
          </a>
          .
        </p>
      </div>

      {/* Token reveal dialog */}
      <Dialog open={Boolean(newToken)} onOpenChange={() => setNewToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your API key now</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This is the only time we&apos;ll show it. Store it securely.
          </p>
          <div className="flex items-center gap-2 rounded-md bg-gray-900 p-3 font-mono text-xs text-gray-100">
            <span className="flex-1 break-all">{newToken}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(newToken!);
                toast.success("Copied");
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* API keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" /> API keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label>Key name</Label>
              <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Permissions</Label>
              <select
                value={perm}
                onChange={(e) => setPerm(e.target.value as never)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="read">Read-only</option>
                <option value="read_write">Read &amp; write</option>
              </select>
            </div>
            <Button
              disabled={!keyName || createKey.isPending}
              onClick={() => createKey.mutate({ name: keyName, permissions: perm })}
            >
              Create key
            </Button>
          </div>

          {keys.isLoading ? (
            <Skeleton className="h-12" />
          ) : (
            <div className="space-y-2">
              {(keys.data ?? []).map((k) => (
                <div key={k.id} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{k.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {k.prefix}… ·{" "}
                      {k.lastUsedAt
                        ? `last used ${format(new Date(k.lastUsedAt), "dd MMM")}`
                        : "never used"}
                    </div>
                  </div>
                  <Badge variant="secondary">{k.permissions}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => revoke.mutate({ id: k.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-4 w-4" /> Webhooks
          </CardTitle>
          <CardDescription>
            Receive HMAC-signed POSTs when events occur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={Boolean(newSecret)} onOpenChange={() => setNewSecret(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Webhook signing secret</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Use this to verify the X-ActProve-Signature header. Shown once.
              </p>
              <div className="rounded-md bg-gray-900 p-3 font-mono text-xs text-gray-100 break-all">
                {newSecret}
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            <Label>Endpoint URL</Label>
            <Input
              placeholder="https://example.com/webhooks/actprove"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {events.data?.map((ev) => (
                <label key={ev} className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={selectedEvents.includes(ev)}
                    onCheckedChange={(c) =>
                      setSelectedEvents((prev) =>
                        c ? [...prev, ev] : prev.filter((x) => x !== ev),
                      )
                    }
                  />
                  {ev}
                </label>
              ))}
            </div>
            <Button
              size="sm"
              disabled={!webhookUrl || selectedEvents.length === 0 || createWebhook.isPending}
              onClick={() =>
                createWebhook.mutate({ url: webhookUrl, events: selectedEvents as never })
              }
            >
              Add webhook
            </Button>
          </div>

          {(webhooks.data ?? []).map((w) => (
            <div key={w.id} className="flex items-center gap-3 rounded-md border p-3 text-sm">
              <div className="flex-1 truncate">
                <div className="truncate font-mono text-xs">{w.url}</div>
                <div className="text-xs text-muted-foreground">
                  {w.events.length} events
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => deleteWebhook.mutate({ id: w.id })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
