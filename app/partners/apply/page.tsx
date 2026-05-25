"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";

export default function PartnerApplyPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("referral");
  const [code, setCode] = useState<string | null>(null);

  const submit = trpc.partner.submit.useMutation({
    onSuccess: (r) => setCode(r.referralCode),
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-16">
        {code ? (
          <Card>
            <CardContent className="space-y-4 p-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-brand-green" />
              <h1 className="text-2xl font-bold">You&apos;re in!</h1>
              <p className="text-sm text-muted-foreground">
                Share this link with clients to earn commission:
              </p>
              <div className="flex items-center gap-2 rounded-md bg-gray-900 p-3 font-mono text-xs text-gray-100">
                <span className="flex-1 break-all">
                  actprove.com/signup?ref={code}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/signup?ref=${code}`,
                    );
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Button asChild variant="outline">
                <Link href={`/partners/dashboard?code=${code}`}>
                  Open your dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-4 p-8">
              <h1 className="text-2xl font-bold">Partner application</h1>
              <div className="space-y-2">
                <Label>Name / firm</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Partner type</Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">Referral (individual)</SelectItem>
                    <SelectItem value="reseller">Reseller (firm)</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!name || !email || submit.isPending}
                onClick={() => submit.mutate({ name, email, tier: tier as never })}
              >
                {submit.isPending ? "Submitting…" : "Apply"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
