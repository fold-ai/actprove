"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export function AckForm({
  token,
  defaultName,
}: {
  token: string;
  defaultName: string;
}) {
  const [name, setName] = useState(defaultName);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/literacy/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else toast.error("Something went wrong. Please try again.");
  }

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand-green" />
        <h2 className="text-xl font-bold">Thank you, {name}!</h2>
        <p className="text-muted-foreground">
          Your AI literacy acknowledgment has been recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Your full name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          checked={agreed}
          onCheckedChange={(c) => setAgreed(Boolean(c))}
          className="mt-0.5"
        />
        <span>
          I confirm I have read and understood my AI-related responsibilities.
        </span>
      </label>
      <Button
        className="w-full"
        disabled={!name || !agreed || loading}
        onClick={submit}
      >
        {loading ? "Submitting…" : "Confirm acknowledgment"}
      </Button>
    </div>
  );
}
