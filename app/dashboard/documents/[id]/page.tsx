"use client";

import { useEffect, useState } from "react";
import { RichEditor } from "@/components/rich-editor";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DOC_STATUS_META } from "@/lib/display";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  Download,
  Save,
  CheckCircle2,
  Archive,
  Sparkles,
  Lightbulb,
  History,
} from "lucide-react";

export default function DocumentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);

  const doc = trpc.documents.get.useQuery({ id });

  useEffect(() => {
    if (doc.data && !loaded) {
      setTitle(doc.data.title);
      setContent(doc.data.contentHtml ?? "");
      setLoaded(true);
    }
  }, [doc.data, loaded]);

  const update = trpc.documents.update.useMutation({
    onSuccess: () => {
      toast.success("Saved");
      utils.documents.get.invalidate({ id });
    },
    onError: (e) => toast.error(e.message),
  });
  const publish = trpc.documents.publish.useMutation({
    onSuccess: () => {
      toast.success("Published");
      utils.documents.get.invalidate({ id });
    },
  });
  const archive = trpc.documents.archive.useMutation({
    onSuccess: () => {
      toast.success("Archived");
      router.push("/dashboard/documents");
    },
  });
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const suggest = trpc.documents.suggest.useMutation({
    onSuccess: (r) => setSuggestions(r.suggestions),
    onError: (e) => toast.error(e.message),
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const versions = trpc.documents.versions.useQuery(
    { id },
    { enabled: historyOpen },
  );

  if (doc.isLoading) return <Skeleton className="h-96" />;
  if (!doc.data) return <p>Document not found.</p>;

  const meta = DOC_STATUS_META[doc.data.status];

  function save() {
    update.mutate({ id, title, contentHtml: content });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Documents
        </Link>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            meta.className,
          )}
        >
          {meta.label}
        </span>
      </div>

      {doc.data.status === "outdated" && (
        <div className="rounded-md bg-risk-limited-bg p-3 text-sm text-risk-limited">
          Source data has changed since this document was generated —
          regeneration recommended.
        </div>
      )}

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-lg font-semibold"
      />

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={update.isPending}>
          <Save className="h-4 w-4" /> Save{" "}
          {doc.data.version > 1 ? `(v${doc.data.version})` : ""}
        </Button>
        <Button
          variant="outline"
          onClick={() => publish.mutate({ id })}
          disabled={doc.data.status === "published"}
        >
          <CheckCircle2 className="h-4 w-4" /> Publish
        </Button>
        <Button asChild variant="outline">
          <a href={`/api/documents/${id}/pdf`} target="_blank" rel="noopener">
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </Button>
        <Button
          variant="outline"
          onClick={() => suggest.mutate({ id })}
          disabled={suggest.isPending}
        >
          <Sparkles className="h-4 w-4" /> {suggest.isPending ? "Reviewing…" : "AI review"}
        </Button>
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <History className="h-4 w-4" /> History
              {doc.data.version > 1 ? ` (v${doc.data.version})` : ""}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Version history</DialogTitle>
            </DialogHeader>
            {versions.isLoading ? (
              <Skeleton className="h-32" />
            ) : (versions.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No previous versions yet. Edits create a new version automatically.
              </p>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {versions.data!.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">Version {v.version}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(v.createdAt), "dd MMM yyyy, HH:mm")}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setContent(v.contentHtml ?? "");
                        setEditorKey((k) => k + 1);
                        setHistoryOpen(false);
                        toast.message(`Restored v${v.version} — save to keep it`);
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          className="ml-auto text-destructive"
          onClick={() => archive.mutate({ id })}
        >
          <Archive className="h-4 w-4" /> Archive
        </Button>
      </div>

      {suggestions && (
        <Card className="border-brand-navy/30">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-brand-green" /> Suggested improvements
            </div>
            {suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No issues found — this document looks complete.
              </p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {loaded && (
        <RichEditor key={editorKey} initialHtml={content} onChange={setContent} />
      )}
      <p className="text-center text-xs text-muted-foreground">
        Edit the document above. This document does not constitute legal advice.
      </p>
    </div>
  );
}
