"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { CheckCircle2, MoreVertical, RefreshCw, Archive } from "lucide-react";
import type { SystemStatus } from "@prisma/client";

export function SystemActions({
  id,
  status,
}: {
  id: string;
  status: SystemStatus;
}) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const markReviewed = trpc.aiSystems.markReviewed.useMutation({
    onSuccess: () => {
      toast.success("Marked as reviewed");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const setStatus = trpc.aiSystems.setStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const reclassify = trpc.aiSystems.classify.useMutation({
    onSuccess: () => {
      toast.success("Re-classified");
      refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const archive = trpc.aiSystems.archive.useMutation({
    onSuccess: () => {
      toast.success("System archived");
      router.push("/dashboard/inventory");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex items-center gap-2">
      <Select
        value={status}
        onValueChange={(v) => setStatus.mutate({ id, status: v as never })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="review">In review</SelectItem>
          <SelectItem value="needs_action">Needs action</SelectItem>
          <SelectItem value="compliant">Compliant</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        onClick={() => markReviewed.mutate({ id })}
        disabled={markReviewed.isPending}
      >
        <CheckCircle2 className="h-4 w-4" /> Mark reviewed
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => reclassify.mutate({ id })}>
            <RefreshCw className="h-4 w-4" /> Re-run classification
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => archive.mutate({ id })}
          >
            <Archive className="h-4 w-4" /> Archive system
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
