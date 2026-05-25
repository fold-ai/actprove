"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, ClipboardList } from "lucide-react";
import { format } from "date-fns";

export default function QuestionnairesPage() {
  const router = useRouter();
  const list = trpc.questionnaires.list.useQuery();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [text, setText] = useState("");

  const create = trpc.questionnaires.create.useMutation({
    onSuccess: (q) => {
      toast.success("Questionnaire created");
      setOpen(false);
      router.push(`/dashboard/questionnaires/${q.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Security questionnaires</h2>
          <p className="text-sm text-muted-foreground">
            Paste client questions and auto-fill answers from your compliance
            data.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New questionnaire
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New questionnaire</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Acme Corp Security Review Q2 2026"
                />
              </div>
              <div className="space-y-1">
                <Label>Client name (optional)</Label>
                <Input value={client} onChange={(e) => setClient(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Paste questions (one per line)</Label>
                <Textarea
                  rows={8}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={"Do you use AI in your product?\nHow do you classify AI risk?\n..."}
                />
              </div>
              <Button
                className="w-full"
                disabled={!title || !text || create.isPending}
                onClick={() =>
                  create.mutate({ title, clientName: client || undefined, rawText: text })
                }
              >
                {create.isPending ? "Creating…" : "Create & parse"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {list.isLoading ? (
        <Skeleton className="h-40" />
      ) : (list.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ClipboardList className="h-8 w-8 text-brand-navy" />
            <p className="text-sm text-muted-foreground">
              No questionnaires yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.data!.map((q) => {
            const count = Array.isArray(q.rawQuestions)
              ? q.rawQuestions.length
              : 0;
            return (
              <Card key={q.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <ClipboardList className="h-5 w-5 text-brand-navy" />
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/questionnaires/${q.id}`}
                      className="font-medium hover:underline"
                    >
                      {q.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {count} questions
                      {q.clientName ? ` · ${q.clientName}` : ""} ·{" "}
                      {format(new Date(q.createdAt), "dd MMM yyyy")}
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {q.status}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
