"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ExternalLink, Copy } from "lucide-react";

export default function TrustPageSettings() {
  const settings = trpc.trust.settings.useQuery();
  const current = trpc.org.current.useQuery();
  const utils = trpc.useUtils();

  const [enabled, setEnabled] = useState(false);
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState("");
  const [showSummary, setShowSummary] = useState(true);
  const [showSystems, setShowSystems] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  useEffect(() => {
    if (settings.data) {
      setEnabled(settings.data.trustPageEnabled);
      setSlug(settings.data.trustPageSlug ?? "");
      setMessage(settings.data.trustPageMessage ?? "");
      setShowSummary(settings.data.config.showSummary);
      setShowSystems(settings.data.config.showSystems);
      setShowDocuments(settings.data.config.showDocuments);
    }
  }, [settings.data]);

  const update = trpc.trust.update.useMutation({
    onSuccess: (d) => {
      toast.success("Saved");
      if (d.trustPageSlug) setSlug(d.trustPageSlug);
      utils.trust.settings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (settings.isLoading) return <Skeleton className="h-96" />;

  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = slug ? `${appUrl}/trust/${slug}` : "";
  const orgId = current.data?.org.id;
  const embed = orgId
    ? `<a href="${publicUrl}" target="_blank">\n  <img src="${appUrl}/api/badge/${orgId}" alt="EU AI Act Compliant — Verified by ActProve" width="180" height="60" />\n</a>`
    : "";

  function save() {
    update.mutate({
      enabled,
      slug: slug || undefined,
      message,
      config: { showSummary, showSystems, showDocuments },
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">Trust Page</h2>
        <p className="text-sm text-muted-foreground">
          A public page that shows your compliance posture to clients and
          auditors in real time.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Enable public Trust Page</div>
              <div className="text-sm text-muted-foreground">
                Anyone with the link can view your compliance status.
              </div>
            </div>
            <Checkbox
              checked={enabled}
              onCheckedChange={(c) => setEnabled(Boolean(c))}
            />
          </label>

          <div className="space-y-2">
            <Label>Custom URL slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/trust/</span>
              <Input
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                placeholder="your-company"
              />
            </div>
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-sm text-brand-navy underline"
              >
                {publicUrl} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label>Custom message (max 200 chars)</Label>
            <Textarea
              maxLength={200}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sections to show</CardTitle>
          <CardDescription>Control what visitors can see.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Compliance summary", v: showSummary, set: setShowSummary },
            { label: "AI systems list", v: showSystems, set: setShowSystems },
            { label: "Published documents", v: showDocuments, set: setShowDocuments },
          ].map((s) => (
            <label
              key={s.label}
              className="flex items-center gap-2 rounded-md border p-3"
            >
              <Checkbox
                checked={s.v}
                onCheckedChange={(c) => s.set(Boolean(c))}
              />
              <span className="text-sm">{s.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance badge</CardTitle>
          <CardDescription>
            Embed this on your website. The status updates automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {orgId && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${appUrl}/api/badge/${orgId}`}
              alt="ActProve badge"
              width={180}
              height={60}
            />
          )}
          <div className="relative">
            <pre className="overflow-x-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
              {embed}
            </pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute right-2 top-2"
              onClick={() => {
                navigator.clipboard.writeText(embed);
                toast.success("Embed code copied");
              }}
            >
              <Copy className="h-3 w-3" /> Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
