"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Copy } from "lucide-react";

const CONF: Record<string, string> = {
  high: "bg-risk-minimal-bg text-risk-minimal",
  medium: "bg-risk-limited-bg text-risk-limited",
  low: "bg-risk-prohibited-bg text-risk-prohibited",
};

export default function QuestionnaireDetail() {
  const { id } = useParams<{ id: string }>();
  const utils = trpc.useUtils();
  const q = trpc.questionnaires.get.useQuery({ id });

  const generate = trpc.questionnaires.generate.useMutation({
    onSuccess: () => {
      toast.success("Answers generated");
      utils.questionnaires.get.invalidate({ id });
    },
    onError: (e) => toast.error(e.message),
  });

  if (q.isLoading) return <Skeleton className="h-96" />;
  if (!q.data) return <p>Not found.</p>;

  const questions = (q.data.rawQuestions as { question: string }[]) ?? [];
  const answers =
    (q.data.generatedAnswers as
      | { question: string; answer: string; confidence: string }[]
      | null) ?? null;

  function copyAll() {
    if (!answers) return;
    const text = answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/dashboard/questionnaires"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Questionnaires
      </Link>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{q.data.title}</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => generate.mutate({ id })}
            disabled={generate.isPending}
          >
            <Sparkles className="h-4 w-4" />
            {generate.isPending
              ? "Generating…"
              : answers
                ? "Regenerate"
                : "Generate answers"}
          </Button>
          {answers && (
            <Button variant="outline" onClick={copyAll}>
              <Copy className="h-4 w-4" /> Copy all
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((item, i) => {
          const a = answers?.[i];
          return (
            <Card key={i}>
              <CardContent className="space-y-2 p-4">
                <div className="font-medium">{item.question}</div>
                {a ? (
                  <>
                    <p className="text-sm text-muted-foreground">{a.answer}</p>
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        CONF[a.confidence] ?? CONF.low,
                      )}
                    >
                      {a.confidence} confidence
                    </span>
                  </>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    No answer yet — click Generate.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
