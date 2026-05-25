"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AI_CATALOG, CATALOG_GROUPS } from "@/server/data/ai-catalog";
import { AI_CATEGORIES, DATA_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check, Search } from "lucide-react";

type Props = { open: boolean; onOpenChange: (o: boolean) => void };

export function AddSystemDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const utils = trpc.useUtils();

  function done(msg: string) {
    toast.success(msg);
    utils.aiSystems.list.invalidate();
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add an AI system</DialogTitle>
          <DialogDescription>
            Pick from the catalog for a 60-second add, or describe a custom tool.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="catalog">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="csv">CSV import</TabsTrigger>
          </TabsList>
          <TabsContent value="catalog">
            <CatalogPicker onDone={done} />
          </TabsContent>
          <TabsContent value="manual">
            <ManualWizard onDone={done} />
          </TabsContent>
          <TabsContent value="csv">
            <CsvImport onDone={done} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CatalogPicker({ onDone }: { onDone: (m: string) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const add = trpc.aiSystems.addFromCatalog.useMutation({
    onSuccess: (r) => onDone(`Added ${r.count} system${r.count === 1 ? "" : "s"}`),
    onError: (e) => toast.error(e.message),
  });

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const q = search.toLowerCase();

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tools…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
        {CATALOG_GROUPS.map((group) => {
          const tools = AI_CATALOG.filter(
            (t) =>
              t.group === group &&
              (q === "" || t.name.toLowerCase().includes(q)),
          );
          if (tools.length === 0) return null;
          return (
            <div key={group}>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {tools.map((t) => {
                  const on = selected.has(t.name);
                  return (
                    <button
                      key={t.name}
                      onClick={() => toggle(t.name)}
                      className={cn(
                        "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors",
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
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm text-muted-foreground">
          {selected.size} selected
        </span>
        <Button
          disabled={selected.size === 0 || add.isPending}
          onClick={() =>
            add.mutate({ names: Array.from(selected), custom: [] })
          }
        >
          {add.isPending ? "Adding…" : `Add ${selected.size || ""} system(s)`}
        </Button>
      </div>
    </div>
  );
}

const STEPS = ["Basics", "Data & People", "Vendor", "Review"];

function ManualWizard({ onDone }: { onDone: (m: string) => void }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    name: "",
    vendor: "",
    category: "" as string,
    description: "",
    useCase: "",
    dataProcessed: [] as string[],
    affectsPeople: false,
    affectsEmployment: false,
    affectsCredit: false,
    affectsHealthcare: false,
    isPublicFacing: false,
    hasChatbotUi: false,
    hidesAiNature: false,
    generatesContent: false,
    isRealtimeBiometric: false,
    vendorCompliant: undefined as boolean | undefined,
    dpaInPlace: undefined as "yes" | "no" | "in_progress" | undefined,
    dataLocation: undefined as "eu" | "non_eu" | "unknown" | undefined,
    notes: "",
  });

  const create = trpc.aiSystems.create.useMutation({
    onSuccess: () => onDone("System added and classified"),
    onError: (e) => toast.error(e.message),
  });

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }
  function toggleData(v: string) {
    set(
      "dataProcessed",
      f.dataProcessed.includes(v)
        ? f.dataProcessed.filter((d) => d !== v)
        : [...f.dataProcessed, v],
    );
  }

  const canNext =
    step !== 0 || (f.name.trim() !== "" && f.category !== "");

  function submit() {
    create.mutate({
      name: f.name,
      vendor: f.vendor || undefined,
      category: f.category as never,
      description: f.description || undefined,
      useCase: f.useCase || undefined,
      dataProcessed: f.dataProcessed,
      affectsPeople: f.affectsPeople,
      affectsEmployment: f.affectsEmployment,
      affectsCredit: f.affectsCredit,
      affectsHealthcare: f.affectsHealthcare,
      isPublicFacing: f.isPublicFacing,
      hasChatbotUi: f.hasChatbotUi,
      hidesAiNature: f.hidesAiNature,
      generatesContent: f.generatesContent,
      isRealtimeBiometric: f.isRealtimeBiometric,
      vendorCompliant: f.vendorCompliant,
      dpaInPlace: f.dpaInPlace,
      dataLocation: f.dataLocation,
      notes: f.notes || undefined,
    });
  }

  const YesNo = ({
    label,
    field,
  }: {
    label: string;
    field: keyof typeof f;
  }) => (
    <label className="flex items-center justify-between gap-2 rounded-md border p-2.5 text-sm">
      <span>{label}</span>
      <Checkbox
        checked={Boolean(f[field])}
        onCheckedChange={(c) => set(field, Boolean(c) as never)}
      />
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                i <= step ? "bg-brand-navy text-white" : "bg-gray-200 text-gray-500",
              )}
            >
              {i + 1}
            </div>
            <span className="hidden text-xs sm:inline">{s}</span>
          </div>
        ))}
      </div>

      <div className="min-h-[260px] space-y-3">
        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label>System name *</Label>
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input
                  value={f.vendor}
                  onChange={(e) => set("vendor", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={f.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>What does this system do?</Label>
              <Textarea
                maxLength={500}
                value={f.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>How does your company use it?</Label>
              <Textarea
                maxLength={500}
                value={f.useCase}
                onChange={(e) => set("useCase", e.target.value)}
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Label>What types of data does it process?</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DATA_TYPES.map((d) => (
                <label
                  key={d.value}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <Checkbox
                    checked={f.dataProcessed.includes(d.value)}
                    onCheckedChange={() => toggleData(d.value)}
                  />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
            <div className="grid gap-2 pt-2">
              <YesNo label="Makes or assists decisions affecting people?" field="affectsPeople" />
              <YesNo label="Used in hiring / employee management?" field="affectsEmployment" />
              <YesNo label="Used in credit / insurance / financial decisions?" field="affectsCredit" />
              <YesNo label="Used in healthcare / medical diagnosis?" field="affectsHealthcare" />
              <YesNo label="Interacts directly with your customers?" field="isPublicFacing" />
              <YesNo label="Presents as human / hides that it is AI?" field="hidesAiNature" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label>Has the vendor confirmed EU AI Act compliance?</Label>
              <Select
                value={
                  f.vendorCompliant === undefined
                    ? ""
                    : f.vendorCompliant
                      ? "yes"
                      : "no"
                }
                onValueChange={(v) => set("vendorCompliant", v === "yes")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No / Don&apos;t know</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Processing Agreement in place?</Label>
              <Select
                value={f.dpaInPlace ?? ""}
                onValueChange={(v) => set("dpaInPlace", v as never)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Where is data processed?</Label>
              <Select
                value={f.dataLocation ?? ""}
                onValueChange={(v) => set("dataLocation", v as never)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eu">EU</SelectItem>
                  <SelectItem value="non_eu">Non-EU</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="rounded-md bg-secondary p-4 text-sm">
              <div className="font-semibold">{f.name || "Untitled system"}</div>
              <div className="text-muted-foreground">
                {f.vendor && `${f.vendor} · `}
                {AI_CATEGORIES.find((c) => c.value === f.category)?.label ??
                  "No category"}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Risk tier will be calculated automatically on save based on your
                answers.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Internal notes</Label>
              <Textarea
                value={f.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <Button
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        ) : (
          <Button disabled={create.isPending} onClick={submit}>
            {create.isPending ? "Saving…" : "Confirm & save"}
          </Button>
        )}
      </div>
    </div>
  );
}

const CSV_CATEGORIES = ["crm", "chatbot", "hr", "analytics", "content", "code", "other"];
const CSV_TEMPLATE =
  "name,vendor,category,useCase\nHubSpot AI,HubSpot,crm,Marketing automation\nInternal Chatbot,Acme,chatbot,Customer support\n";

function CsvImport({ onDone }: { onDone: (m: string) => void }) {
  const [text, setText] = useState("");
  const importCsv = trpc.aiSystems.bulkImportCsv.useMutation({
    onSuccess: (r) => onDone(`Imported ${r.count} system${r.count === 1 ? "" : "s"}`),
    onError: (e) => toast.error(e.message),
  });

  const rows = parseCsv(text);

  function download() {
    const url = `data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "actprove-inventory-template.csv";
    a.click();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Columns: <code>name, vendor, category, useCase</code>. One system per row.
        </p>
        <Button size="sm" variant="outline" onClick={download}>
          Download template
        </Button>
      </div>
      <Textarea
        rows={8}
        placeholder={CSV_TEMPLATE}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="font-mono text-xs"
      />
      {rows.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-md border text-sm">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2 border-b px-3 py-1.5 last:border-0">
              <span className="flex-1 truncate font-medium">{r.name}</span>
              <span className="text-muted-foreground">{r.vendor || "—"}</span>
              <span className="text-xs text-muted-foreground">{r.category}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm text-muted-foreground">{rows.length} row(s)</span>
        <Button
          disabled={rows.length === 0 || importCsv.isPending}
          onClick={() => importCsv.mutate({ rows })}
        >
          {importCsv.isPending ? "Importing…" : `Import ${rows.length || ""} system(s)`}
        </Button>
      </div>
    </div>
  );
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const hasHeader = header.includes("name");
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const idx = (k: string) => (hasHeader ? header.indexOf(k) : -1);
  const ni = idx("name"), vi = idx("vendor"), ci = idx("category"), ui = idx("usecase");
  return dataLines
    .map((line) => {
      const cells = line.split(",").map((c) => c.trim());
      const name = (ni >= 0 ? cells[ni] : cells[0]) ?? "";
      const cat = (ci >= 0 ? cells[ci] : cells[2]) ?? "other";
      return {
        name,
        vendor: (vi >= 0 ? cells[vi] : cells[1]) || undefined,
        category: (CSV_CATEGORIES.includes(cat) ? cat : "other") as
          | "crm" | "chatbot" | "hr" | "analytics" | "content" | "code" | "other",
        useCase: (ui >= 0 ? cells[ui] : cells[3]) || undefined,
        dataProcessed: [] as string[],
        affectsEmployment: false,
        affectsCredit: false,
        affectsHealthcare: false,
        isPublicFacing: false,
        hasChatbotUi: false,
      };
    })
    .filter((r) => r.name.length > 0);
}
