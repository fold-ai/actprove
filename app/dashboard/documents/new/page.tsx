"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import type { DocumentType } from "@prisma/client";

const ORG_WIDE = "__org__";

export default function NewDocumentPage() {
  const router = useRouter();
  const types = trpc.documents.types.useQuery();
  const systems = trpc.aiSystems.list.useQuery({});
  const [type, setType] = useState<DocumentType | null>(null);
  const [systemId, setSystemId] = useState<string>(ORG_WIDE);
  const [notes, setNotes] = useState("");

  const generate = trpc.documents.generate.useMutation({
    onSuccess: (doc) => {
      toast.success("Document generated");
      router.push(`/dashboard/documents/${doc.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedMeta = types.data?.find((t) => t.type === type);
  const isSystemScope = selectedMeta?.scope === "system";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/dashboard/documents"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Documents
      </Link>
      <h2 className="text-xl font-bold">Generate a document</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {types.data?.map((t) => (
          <button
            key={t.type}
            onClick={() => setType(t.type)}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              type === t.type
                ? "border-brand-navy bg-secondary"
                : "hover:bg-gray-50",
            )}
          >
            <div className="flex items-center gap-2 font-medium">
              <FileText className="h-4 w-4 text-brand-navy" />
              {t.title}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t.description}
            </div>
          </button>
        ))}
      </div>

      {type && (
        <Card>
          <CardContent className="space-y-4 p-5">
            {isSystemScope && (
              <div className="space-y-2">
                <Label>Which AI system?</Label>
                <Select value={systemId} onValueChange={setSystemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    {(systems.data ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Custom context (optional)</Label>
              <Textarea
                placeholder="Add any specific notes for this document…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={
                generate.isPending ||
                (isSystemScope && systemId === ORG_WIDE)
              }
              onClick={() =>
                generate.mutate({
                  type,
                  aiSystemId:
                    isSystemScope && systemId !== ORG_WIDE ? systemId : undefined,
                  customNotes: notes || undefined,
                })
              }
            >
              <Sparkles className="h-4 w-4" />
              {generate.isPending ? "Generating…" : "Generate document"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
