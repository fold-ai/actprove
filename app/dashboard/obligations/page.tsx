"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Status = "todo" | "in_progress" | "in_review" | "complete";
const COLUMNS: { id: Status; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "in_review", label: "In Review" },
  { id: "complete", label: "Complete" },
];
const PRIORITY_CLASS: Record<string, string> = {
  critical: "bg-risk-prohibited-bg text-risk-prohibited",
  high: "bg-risk-high-bg text-risk-high",
  medium: "bg-risk-limited-bg text-risk-limited",
  low: "bg-risk-pending-bg text-risk-pending",
};

interface Ob {
  id: string;
  status: string;
  code: string;
  title: string;
  priority: string;
  frameworkCode: string;
  frameworkName: string;
}

function Card({ ob }: { ob: Ob }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: ob.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
          : undefined
      }
      className={cn(
        "cursor-grab rounded-md border bg-white p-3 text-sm shadow-sm active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-muted-foreground">
          {ob.code}
        </span>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
            PRIORITY_CLASS[ob.priority],
          )}
        >
          {ob.priority}
        </span>
      </div>
      <div className="font-medium">{ob.title}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {ob.frameworkName}
      </div>
    </div>
  );
}

function Column({ id, label, items }: { id: Status; label: string; items: Ob[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[400px] w-full flex-col gap-2 rounded-lg border bg-gray-50 p-3",
        isOver && "ring-2 ring-brand-navy",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold">{label}</span>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.map((ob) => (
        <Card key={ob.id} ob={ob} />
      ))}
    </div>
  );
}

function ObligationsInner() {
  const params = useSearchParams();
  const utils = trpc.useUtils();
  const [framework, setFramework] = useState(params.get("framework") ?? "all");

  const list = trpc.frameworks.obligations.useQuery({
    frameworkCode: framework === "all" ? undefined : framework,
  });
  const available = trpc.frameworks.available.useQuery();
  const setStatus = trpc.frameworks.setObligationStatus.useMutation({
    onError: (e) => {
      toast.error(e.message);
      utils.frameworks.obligations.invalidate();
    },
  });

  const [items, setItems] = useState<Ob[]>([]);
  useEffect(() => {
    if (list.data) setItems(list.data as Ob[]);
  }, [list.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    const overId = e.over?.id as Status | undefined;
    if (!overId) return;
    const id = e.active.id as string;
    const current = items.find((i) => i.id === id);
    if (!current || current.status === overId) return;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: overId } : i)),
    );
    setStatus.mutate({ id, status: overId });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Obligations</h2>
          <p className="text-sm text-muted-foreground">
            Track compliance work across all frameworks. Drag cards to update
            status.
          </p>
        </div>
        <Select value={framework} onValueChange={setFramework}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All frameworks</SelectItem>
            {available.data
              ?.filter((f) => f.active)
              .map((f) => (
                <SelectItem key={f.code} value={f.code}>
                  {f.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {list.isLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-white py-16 text-center text-muted-foreground">
          No obligations yet. Activate a framework to generate obligations.
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                id={col.id}
                label={col.label}
                items={items.filter(
                  (i) =>
                    i.status === col.id ||
                    (col.id === "complete" && i.status === "not_applicable"),
                )}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}

export default function ObligationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <ObligationsInner />
    </Suspense>
  );
}
