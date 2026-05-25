"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const LOCALES = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "pl", label: "Polski" },
  { value: "nl", label: "Nederlands" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
];

export default function PreferencesPage() {
  const current = trpc.org.current.useQuery();
  const [locale, setLocale] = useState("en");
  const [docLocale, setDocLocale] = useState("en");
  const [dateFormat, setDateFormat] = useState("dd MMM yyyy");
  const [benchmark, setBenchmark] = useState(true);

  useEffect(() => {
    if (current.data?.org) {
      const o = current.data.org;
      setLocale(o.locale);
      setDocLocale(o.documentLocale);
      setDateFormat(o.dateFormat);
      setBenchmark(o.benchmarkOptIn);
    }
  }, [current.data]);

  const update = trpc.org.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferences saved");
      current.refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (current.isLoading) return <Skeleton className="h-80" />;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold">Preferences</h2>
      <Card>
        <CardHeader>
          <CardTitle>Language &amp; format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Interface language</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Generated document language</Label>
              <Select value={docLocale} onValueChange={setDocLocale}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Date format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd MMM yyyy">31 Dec 2026</SelectItem>
                  <SelectItem value="dd/MM/yyyy">31/12/2026</SelectItem>
                  <SelectItem value="MM/dd/yyyy">12/31/2026</SelectItem>
                  <SelectItem value="yyyy-MM-dd">2026-12-31</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
            <Checkbox
              checked={benchmark}
              onCheckedChange={(c) => setBenchmark(Boolean(c))}
            />
            <span>
              Contribute anonymised data to industry benchmarks (and see how you
              compare). You can opt out anytime.
            </span>
          </label>
          <div className="flex justify-end">
            <Button
              onClick={() =>
                update.mutate({
                  locale,
                  documentLocale: docLocale,
                  dateFormat,
                  benchmarkOptIn: benchmark,
                })
              }
              disabled={update.isPending}
            >
              {update.isPending ? "Saving…" : "Save preferences"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Document language applies to newly generated documents. Full UI
            translation (next-intl) ships per the Phase 2 localisation roadmap.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
