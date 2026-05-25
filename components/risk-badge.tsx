import { cn } from "@/lib/utils";
import { RISK_META, PENDING_META, STATUS_META } from "@/lib/display";
import type { RiskTier, SystemStatus } from "@prisma/client";

export function RiskBadge({
  tier,
  className,
}: {
  tier: RiskTier | null | undefined;
  className?: string;
}) {
  const meta = tier ? RISK_META[tier] : PENDING_META;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: SystemStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
