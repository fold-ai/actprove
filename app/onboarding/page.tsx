"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Logo } from "@/components/logo";
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
import { AI_CATALOG, CATALOG_GROUPS } from "@/server/data/ai-catalog";
import { INDUSTRIES, EMPLOYEE_RANGES, PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, ShieldCheck } from "lucide-react";

const STEPS = [
  "Company",
  "Your AI role",
  "Quick scan",
  "Risk snapshot",
  "Choose plan",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [industry, setIndustry] = useState("");
  const [employees, setEmployees] = useState("");
  const [website, setWebsite] = useState("");
  const [role, setRole] = useState<"provider" | "deployer" | "both">("deployer");

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [scanResult, setScanResult] = useState<{ count: number } | null>(null);

  const updateProfile = trpc.org.updateProfile.useMutation();
  const addCatalog = trpc.aiSystems.addFromCatalog.useMutation();
  const complete = trpc.org.completeOnboarding.useMutation();
  const { data: snapshot } = trpc.org.current.useQuery(undefined, {
    enabled: step >= 3,
  });

  function next() {
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  async function saveCompany() {
    await updateProfile.mutateAsync({
      industry: industry || undefined,
      employeeCount: employees
        ? parseInt(employees.replace(/\D/g, "")) || undefined
        : undefined,
      website: website || undefined,
      role,
    });
    next();
  }

  async function runScan() {
    if (picked.size === 0) {
      next();
      return;
    }
    const res = await addCatalog.mutateAsync({
      names: Array.from(picked),
      custom: [],
    });
    setScanResult({ count: res.count });
    next();
  }

  async function finish(toPlan?: string) {
    await complete.mutateAsync();
    if (toPlan) {
      router.push(`/dashboard/settings/billing?plan=${toPlan}`);
    } else {
      toast.success("You're all set!");
      router.push("/dashboard");
    }
  }

  function togglePick(name: string) {
    setPicked((prev) => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button
            onClick={() => finish()}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6 flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full",
                  i <= step ? "bg-brand-navy" : "bg-gray-200",
                )}
              />
              <span className="mt-1 hidden text-xs text-muted-foreground sm:block">
                {s}
              </span>
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Tell us about your company</h2>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Approximate employees</Label>
                  <Select value={employees} onValueChange={setEmployees}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_RANGES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Company website</Label>
                  <Input
                    placeholder="https://"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveCompany} disabled={updateProfile.isPending}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Your AI role</h2>
                <p className="text-sm text-muted-foreground">
                  Does your company develop or train AI systems (build AI
                  products), or mainly use AI-powered tools?
                </p>
                <div className="grid gap-3">
                  {[
                    {
                      v: "deployer" as const,
                      t: "We use AI tools",
                      d: "We use AI-powered tools in our operations (most SMBs). Lighter obligations.",
                    },
                    {
                      v: "provider" as const,
                      t: "We build AI products",
                      d: "We develop or train AI systems that others use.",
                    },
                    {
                      v: "both" as const,
                      t: "Both",
                      d: "We build AI products and use AI tools internally.",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setRole(opt.v)}
                      className={cn(
                        "rounded-lg border p-4 text-left transition-colors",
                        role === opt.v
                          ? "border-brand-navy bg-secondary"
                          : "hover:bg-gray-50",
                      )}
                    >
                      <div className="font-medium">{opt.t}</div>
                      <div className="text-sm text-muted-foreground">{opt.d}</div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(0)}>
                    Back
                  </Button>
                  <Button onClick={next}>Continue</Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Quick AI inventory scan</h2>
                <p className="text-sm text-muted-foreground">
                  Select the AI tools your company uses. We&apos;ll add and
                  classify each one automatically.
                </p>
                <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
                  {CATALOG_GROUPS.map((group) => (
                    <div key={group}>
                      <div className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
                        {group}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {AI_CATALOG.filter((t) => t.group === group).map((t) => {
                          const on = picked.has(t.name);
                          return (
                            <button
                              key={t.name}
                              onClick={() => togglePick(t.name)}
                              className={cn(
                                "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm",
                                on
                                  ? "border-brand-navy bg-secondary"
                                  : "hover:bg-gray-50",
                              )}
                            >
                              <span className="truncate">{t.name}</span>
                              {on && <Check className="h-4 w-4 text-brand-navy" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={runScan} disabled={addCatalog.isPending}>
                    {addCatalog.isPending
                      ? "Adding…"
                      : picked.size
                        ? `Add ${picked.size} & continue`
                        : "Skip"}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Your initial risk snapshot</h2>
                {scanResult && (
                  <p className="text-sm text-muted-foreground">
                    Added {scanResult.count} systems to your inventory.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { k: "systems", label: "Total systems", v: snapshot?.stats.systems ?? 0 },
                    { k: "health", label: "Health score", v: `${snapshot?.stats.healthScore ?? 0}%` },
                    { k: "compliant", label: "Compliant", v: snapshot?.stats.compliant ?? 0 },
                    { k: "docs", label: "Documents", v: snapshot?.stats.documents ?? 0 },
                  ].map((s) => (
                    <div key={s.k} className="rounded-md bg-secondary p-3 text-center">
                      <div className="text-2xl font-bold">{s.v}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-md bg-risk-minimal-bg p-4 text-sm text-risk-minimal">
                  <strong>Good news!</strong> As a {role}, your compliance path is
                  manageable. We&apos;ll guide you through transparency notices,
                  an AI usage policy, and your living register.
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={next}>Continue</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Choose your plan</h2>
                <p className="text-sm text-muted-foreground">
                  Your 14-day free trial includes full Growth access. Pick a plan
                  now or decide later.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {PLANS.map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        "rounded-lg border p-4",
                        p.id === "growth" && "border-brand-navy ring-1 ring-brand-navy",
                      )}
                    >
                      <div className="flex items-center gap-1 font-semibold">
                        <ShieldCheck className="h-4 w-4 text-brand-green" />
                        {p.name}
                      </div>
                      <div className="my-1 text-2xl font-bold">
                        ${p.price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /mo
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant={p.id === "growth" ? "default" : "outline"}
                        className="mt-2 w-full"
                        onClick={() => finish(p.id)}
                        disabled={complete.isPending}
                      >
                        Choose {p.name}
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button variant="link" onClick={() => finish()}>
                    I&apos;ll choose a plan later →
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
