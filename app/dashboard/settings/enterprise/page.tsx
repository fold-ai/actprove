"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Copy, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

export default function EnterprisePage() {
  const utils = trpc.useUtils();
  const sessions = trpc.enterprise.auditSessions.useQuery();
  const branding = trpc.enterprise.branding.useQuery();

  const [auditor, setAuditor] = useState("");
  const startAudit = trpc.enterprise.startAudit.useMutation({
    onSuccess: (r) => {
      toast.success("Audit session started");
      const url = `${window.location.origin}/audit/${r.token}`;
      navigator.clipboard.writeText(url);
      toast.message("Auditor link copied to clipboard");
      setAuditor("");
      utils.enterprise.auditSessions.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const endAudit = trpc.enterprise.endAudit.useMutation({
    onSuccess: () => utils.enterprise.auditSessions.invalidate(),
  });

  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [removeBranding, setRemoveBranding] = useState(false);
  useEffect(() => {
    if (branding.data) {
      setLogoUrl(branding.data.logoUrl ?? "");
      setBrandColor(branding.data.brandColor ?? "");
      setRemoveBranding(branding.data.removeBranding);
    }
  }, [branding.data]);
  const updateBranding = trpc.enterprise.updateBranding.useMutation({
    onSuccess: () => {
      toast.success("Branding saved");
      utils.enterprise.branding.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-bold">Enterprise</h2>

      {/* Audit mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> Audit mode
          </CardTitle>
          <CardDescription>
            Invite an external auditor with a read-only link to your full
            compliance picture.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label>Auditor email</Label>
              <Input
                type="email"
                value={auditor}
                onChange={(e) => setAuditor(e.target.value)}
              />
            </div>
            <Button
              disabled={!auditor || startAudit.isPending}
              onClick={() => startAudit.mutate({ auditorEmail: auditor })}
            >
              Start audit
            </Button>
          </div>
          {sessions.isLoading ? (
            <Skeleton className="h-10" />
          ) : (
            (sessions.data ?? []).map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                <div className="flex-1">
                  <div className="font-medium">{s.auditorEmail}</div>
                  <div className="text-xs text-muted-foreground">
                    Started {format(new Date(s.startedAt), "dd MMM yyyy")}
                  </div>
                </div>
                {s.active ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/audit/${s.token}`,
                        );
                        toast.success("Link copied");
                      }}
                    >
                      <Copy className="h-4 w-4" /> Copy link
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => endAudit.mutate({ id: s.id })}>
                      End
                    </Button>
                  </>
                ) : (
                  <Badge variant="secondary">Closed</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* White-label */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">White-label branding</CardTitle>
          <CardDescription>
            Replace ActProve branding on PDFs and your Trust Page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Logo URL</Label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-1">
              <Label>Brand colour (hex)</Label>
              <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} placeholder="#1B4F72" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={removeBranding}
              onCheckedChange={(c) => setRemoveBranding(Boolean(c))}
            />
            Remove &quot;Powered by ActProve&quot; from the public Trust Page
          </label>
          <div className="flex justify-end">
            <Button
              onClick={() =>
                updateBranding.mutate({ logoUrl, brandColor, removeBranding })
              }
              disabled={updateBranding.isPending}
            >
              Save branding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
