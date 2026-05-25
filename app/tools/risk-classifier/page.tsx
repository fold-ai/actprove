"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/risk-badge";

const QUESTIONS: { key: string; label: string }[] = [
  { key: "affectsEmployment", label: "Used in hiring, recruitment or worker management?" },
  { key: "affectsCredit", label: "Used in credit scoring or financial decisions?" },
  { key: "affectsHealthcare", label: "Used in healthcare or medical diagnosis?" },
  { key: "isPublicFacing", label: "Interacts directly with your customers?" },
  { key: "hasChatbotUi", label: "Presents as a chatbot / conversational AI?" },
  { key: "generatesContent", label: "Generates content (text, images, audio)?" },
  { key: "isRealtimeBiometric", label: "Performs real-time biometric identification?" },
];

export default function RiskClassifierTool() {
  const [name, setName] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const classify = trpc.tools.classify.useMutation();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold text-brand-navy">AI Risk Classifier</h1>
        <p className="mt-2 text-muted-foreground">
          Answer a few questions to see which EU AI Act risk tier your AI system
          falls into.
        </p>

        <Card className="mt-6">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label>AI system name (optional)</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HireVue"
              />
            </div>
            <div className="space-y-2">
              {QUESTIONS.map((q) => (
                <label key={q.key} className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
                  <Checkbox
                    checked={Boolean(flags[q.key])}
                    onCheckedChange={(c) =>
                      setFlags((f) => ({ ...f, [q.key]: Boolean(c) }))
                    }
                  />
                  {q.label}
                </label>
              ))}
            </div>
            <Button
              className="w-full"
              disabled={classify.isPending}
              onClick={() =>
                classify.mutate({
                  name: name || undefined,
                  category: "other",
                  affectsEmployment: Boolean(flags.affectsEmployment),
                  affectsCredit: Boolean(flags.affectsCredit),
                  affectsHealthcare: Boolean(flags.affectsHealthcare),
                  isPublicFacing: Boolean(flags.isPublicFacing),
                  hasChatbotUi: Boolean(flags.hasChatbotUi),
                  generatesContent: Boolean(flags.generatesContent),
                  isRealtimeBiometric: Boolean(flags.isRealtimeBiometric),
                  dataProcessed: [],
                })
              }
            >
              {classify.isPending ? "Classifying…" : "Classify my AI system"}
            </Button>
          </CardContent>
        </Card>

        {classify.data && (
          <Card className="mt-6">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Result:</span>
                <RiskBadge tier={classify.data.tier} />
              </div>
              <p className="text-sm">{classify.data.rationale}</p>
              {classify.data.obligations.length > 0 && (
                <div>
                  <div className="mb-1 text-sm font-medium">What you&apos;d need to do</div>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {classify.data.obligations.map((o) => (
                      <li key={o.label}>{o.label}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-lg bg-secondary p-4 text-center">
                <p className="text-sm font-medium">
                  Want this tracked automatically across all your AI tools?
                </p>
                <Button asChild className="mt-2">
                  <Link href="/signup">Start free trial</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is an assessment tool, not a legal determination.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
