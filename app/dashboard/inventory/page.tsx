"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { AddSystemDialog } from "@/components/inventory/add-system-dialog";
import { RiskBadge, StatusBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AI_CATEGORIES } from "@/lib/constants";
import { CATEGORY_LABEL } from "@/lib/display";
import { vendorLogo } from "@/lib/logo-url";
import {
  Plus,
  LayoutGrid,
  TableProperties,
  Database,
  Search,
} from "lucide-react";
import { format } from "date-fns";

const ALL = "all";

function InventoryInner() {
  const params = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [search, setSearch] = useState("");
  const [riskTier, setRiskTier] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(params.get("status") ?? ALL);
  const [category, setCategory] = useState<string>(ALL);

  useEffect(() => {
    if (params.get("add") === "1") setAddOpen(true);
  }, [params]);

  const list = trpc.aiSystems.list.useQuery({
    search: search || undefined,
    riskTier: riskTier === ALL ? undefined : (riskTier as never),
    status: status === ALL ? undefined : (status as never),
    category: category === ALL ? undefined : (category as never),
  });

  const systems = list.data ?? [];
  const total = systems.length;
  const compliant = systems.filter((s) => s.status === "compliant").length;
  const health = total === 0 ? 0 : Math.round((compliant / total) * 100);

  return (
    <div className="space-y-5">
      <AddSystemDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-white p-4">
        <div>
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-xs text-muted-foreground">Total systems</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <div className="text-2xl font-bold text-risk-minimal">{compliant}</div>
          <div className="text-xs text-muted-foreground">Compliant</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <div className="text-2xl font-bold">{health}%</div>
          <div className="text-xs text-muted-foreground">Health score</div>
        </div>
        <Button className="ml-auto" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add system
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={riskTier} onValueChange={setRiskTier}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Risk tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All risk tiers</SelectItem>
            <SelectItem value="minimal_risk">Minimal</SelectItem>
            <SelectItem value="limited_risk">Limited</SelectItem>
            <SelectItem value="high_risk">High risk</SelectItem>
            <SelectItem value="prohibited">Prohibited</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="needs_action">Needs action</SelectItem>
            <SelectItem value="review">In review</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {AI_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-md border">
          <Button
            variant={view === "cards" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setView("table")}
          >
            <TableProperties className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {list.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Database className="h-6 w-6 text-brand-navy" />
            </div>
            <h3 className="text-lg font-semibold">No AI systems yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your inventory is the foundation of EU AI Act compliance. Add your
              first AI tool to classify its risk automatically.
            </p>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add your first system
            </Button>
          </CardContent>
        </Card>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {systems.map((s) => (
            <Link key={s.id} href={`/dashboard/inventory/${s.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {vendorLogo(s.vendor) && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={vendorLogo(s.vendor)!}
                          alt=""
                          width={20}
                          height={20}
                          className="mt-0.5 h-5 w-5 rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.vendor ?? "—"} · {CATEGORY_LABEL[s.category]}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <RiskBadge tier={s.riskTier} />
                  <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                    <span>
                      {s.responsibleUser?.fullName ??
                        s.responsiblePerson ??
                        "Unassigned"}
                    </span>
                    <span>
                      {s.lastReviewedAt
                        ? format(new Date(s.lastReviewedAt), "dd MMM yyyy")
                        : "Never reviewed"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Risk Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Last Reviewed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systems.map((s) => (
                <TableRow key={s.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      href={`/dashboard/inventory/${s.id}`}
                      className="font-medium hover:underline"
                    >
                      {s.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {s.vendor ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell>{CATEGORY_LABEL[s.category]}</TableCell>
                  <TableCell>
                    <RiskBadge tier={s.riskTier} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.responsibleUser?.fullName ??
                      s.responsiblePerson ??
                      "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.lastReviewedAt
                      ? format(new Date(s.lastReviewedAt), "dd MMM yyyy")
                      : "Never"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <InventoryInner />
    </Suspense>
  );
}
