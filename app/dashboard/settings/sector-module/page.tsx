"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiskBadge } from "@/components/risk-badge";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

const SECTORS = [
  { value: "none", label: "No sector module" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance / Fintech" },
  { value: "hr", label: "HR / Recruitment" },
  { value: "legal", label: "Legal / Professional Services" },
  { value: "education", label: "Education" },
  { value: "ecommerce", label: "E-commerce / Retail" },
  { value: "public", label: "Public Sector" },
  { value: "manufacturing", label: "Manufacturing" },
];

export default function SectorModulePage() {
  const current = trpc.org.current.useQuery();
  const rules = trpc.enterprise.customRules.useQuery();
  const utils = trpc.useUtils();
  const [sector, setSector] = useState("none");

  useEffect(() => {
    if (current.data?.org) setSector(current.data.org.sector ?? "none");
  }, [current.data]);

  const updateProfile = trpc.org.updateProfile.useMutation();
  const reclassify = trpc.enterprise.reclassifyAll.useMutation();

  async function saveSector() {
    await updateProfile.mutateAsync({
      sector: sector === "none" ? undefined : sector,
    });
    const res = await reclassify.mutateAsync();
    toast.success(`Sector saved · re-classified ${res.count} systems`);
    utils.org.current.invalidate();
  }

  // Custom rule form
  const [ruleName, setRuleName] = useState("");
  const [dataContains, setDataContains] = useState("personal");
  const [publicFacing, setPublicFacing] = useState(false);
  const [tier, setTier] = useState("high_risk");
  const [label, setLabel] = useState("");
  const createRule = trpc.enterprise.createRule.useMutation({
    onSuccess: () => {
      toast.success("Rule created");
      setRuleName("");
      setLabel("");
      utils.enterprise.customRules.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteRule = trpc.enterprise.deleteRule.useMutation({
    onSuccess: () => utils.enterprise.customRules.invalidate(),
  });

  if (current.isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold">Sector module &amp; custom rules</h2>
        <p className="text-sm text-muted-foreground">
          Tailor risk classification to your industry and internal policies.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sector module</CardTitle>
          <CardDescription>
            Activating a sector applies industry-specific risk overrides (e.g.
            clinical AI in healthcare is always high-risk).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label>Industry sector</Label>
            <Select value={sector} onValueChange={setSector}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={saveSector}
            disabled={updateProfile.isPending || reclassify.isPending}
          >
            {reclassify.isPending ? "Re-classifying…" : "Save & re-classify"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom risk rules</CardTitle>
          <CardDescription>
            Layer internal policies stricter than the EU AI Act. Matching systems
            get a separate internal classification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.isLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="space-y-2">
              {(rules.data ?? []).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-md border p-3 text-sm"
                >
                  <div className="flex-1">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.internalLabel ?? "Internal rule"} · priority {r.priority}
                    </div>
                  </div>
                  <RiskBadge tier={r.resultingTier} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => deleteRule.mutate({ id: r.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 rounded-md border p-3">
            <div className="text-sm font-medium">New rule</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Rule name</Label>
                <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Internal label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>When data includes</Label>
                <Select value={dataContains} onValueChange={setDataContains}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["personal", "biometric", "health", "financial", "location"].map(
                      (d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Set internal tier to</Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_risk">High risk</SelectItem>
                    <SelectItem value="limited_risk">Limited risk</SelectItem>
                    <SelectItem value="prohibited">Prohibited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publicFacing}
                onChange={(e) => setPublicFacing(e.target.checked)}
              />
              Also require public-facing
            </label>
            <Button
              size="sm"
              disabled={!ruleName || createRule.isPending}
              onClick={() =>
                createRule.mutate({
                  name: ruleName,
                  internalLabel: label || undefined,
                  resultingTier: tier as never,
                  priority: 10,
                  condition: {
                    dataProcessed: { contains: dataContains },
                    ...(publicFacing ? { isPublicFacing: true } : {}),
                  },
                })
              }
            >
              <Plus className="h-4 w-4" /> Add rule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
