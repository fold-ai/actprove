"use client";

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Lock, Upload, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";

const BUCKET = "evidence-files";
const CATEGORIES = [
  { value: "vendor_dpa", label: "Vendor DPAs" },
  { value: "conformity", label: "Conformity Assessments" },
  { value: "training", label: "Training Records" },
  { value: "incident", label: "Incident Logs" },
  { value: "policy", label: "Internal Policies" },
  { value: "other", label: "Other" },
];
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export default function VaultPage() {
  const list = trpc.evidence.list.useQuery();
  const usage = trpc.evidence.usage.useQuery();
  const current = trpc.org.current.useQuery();
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("other");
  const [uploading, setUploading] = useState(false);

  const record = trpc.evidence.record.useMutation({
    onSuccess: () => {
      toast.success("File added to vault");
      setLabel("");
      if (fileRef.current) fileRef.current.value = "";
      utils.evidence.list.invalidate();
      utils.evidence.usage.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.evidence.delete.useMutation({
    onSuccess: () => {
      utils.evidence.list.invalidate();
      utils.evidence.usage.invalidate();
    },
  });

  async function onUpload() {
    const file = fileRef.current?.files?.[0];
    const orgId = current.data?.org.id;
    if (!file || !orgId) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${orgId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      await record.mutateAsync({
        filename: file.name,
        fileUrl: data.publicUrl,
        fileSize: file.size,
        mimeType: file.type,
        label: label || undefined,
        category,
      });
    } catch (err) {
      toast.error(
        "Upload failed — ensure the 'evidence-files' Storage bucket exists in Supabase.",
      );
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  const files = list.data ?? [];
  const grouped = CATEGORIES.map((c) => ({
    ...c,
    files: files.filter((f) => (f.category ?? "other") === c.value),
  })).filter((g) => g.files.length > 0);
  const pct = usage.data
    ? Math.min(100, Math.round((usage.data.usedBytes / usage.data.limitBytes) * 100))
    : 0;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold">Evidence vault</h2>
          <p className="text-sm text-muted-foreground">
            Securely store DPAs, certificates, training records and anything an
            auditor might request.
          </p>
        </div>
        {usage.data && (
          <div className="w-48 text-right">
            <div className="text-xs text-muted-foreground">
              {fmtBytes(usage.data.usedBytes)} / {usage.data.limitGb} GB
            </div>
            <Progress value={pct} className="mt-1" />
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" /> Upload evidence
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label>File</Label>
            <Input ref={fileRef} type="file" />
          </div>
          <div className="flex-1 space-y-1">
            <Label>Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Vendor DPA — OpenAI"
            />
          </div>
          <div className="space-y-1">
            <Label>Folder</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onUpload} disabled={uploading}>
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </CardContent>
      </Card>

      {list.isLoading ? (
        <Skeleton className="h-40" />
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Lock className="h-8 w-8 text-brand-navy" />
            No evidence files yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.value}>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                {g.label} ({g.files.length})
              </h3>
              <div className="space-y-2">
                {g.files.map((f) => (
                  <Card key={f.id}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <FileText className="h-5 w-5 text-brand-navy" />
                      <div className="flex-1">
                        <a
                          href={f.fileUrl}
                          target="_blank"
                          rel="noopener"
                          className="font-medium hover:underline"
                        >
                          {f.label ?? f.filename}
                        </a>
                        <div className="text-xs text-muted-foreground">
                          {f.filename} ·{" "}
                          {format(new Date(f.uploadedAt), "dd MMM yyyy")}
                          {f.fileSize ? ` · ${fmtBytes(Number(f.fileSize))}` : ""}
                          {f.aiSystem ? ` · ${f.aiSystem.name}` : ""}
                        </div>
                      </div>
                      <Badge variant="secondary">{CAT_LABEL[f.category ?? "other"] ?? "Other"}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => del.mutate({ id: f.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
