import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { daysUntil } from "@/lib/constants";

export function TrialBanner({
  planStatus,
  trialEndsAt,
}: {
  planStatus: string;
  trialEndsAt: string | Date | null;
}) {
  if (planStatus === "active") return null;

  if (planStatus === "trial_expired" || planStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2 bg-risk-prohibited px-4 py-2 text-sm text-white lg:px-6">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Your account is read-only. Upgrade to keep adding systems and
          generating documents.
        </span>
        <Link
          href="/dashboard/settings/billing"
          className="ml-auto rounded bg-white/20 px-3 py-1 font-medium hover:bg-white/30"
        >
          Upgrade now
        </Link>
      </div>
    );
  }

  if (planStatus === "trialing" && trialEndsAt) {
    const days = daysUntil(trialEndsAt);
    return (
      <div className="flex items-center gap-2 bg-brand-navy-light px-4 py-2 text-sm text-white lg:px-6">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          {days} {days === 1 ? "day" : "days"} left in your free trial — full
          Growth access included.
        </span>
        <Link
          href="/dashboard/settings/billing"
          className="ml-auto rounded bg-white/20 px-3 py-1 font-medium hover:bg-white/30"
        >
          Choose a plan
        </Link>
      </div>
    );
  }

  if (planStatus === "past_due") {
    return (
      <div className="flex items-center gap-2 bg-risk-limited px-4 py-2 text-sm text-white lg:px-6">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Your last payment failed. Please update your payment method.</span>
        <Link
          href="/dashboard/settings/billing"
          className="ml-auto rounded bg-white/20 px-3 py-1 font-medium hover:bg-white/30"
        >
          Update payment
        </Link>
      </div>
    );
  }

  return null;
}
