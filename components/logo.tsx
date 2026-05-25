import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-navy text-white">
        <ShieldCheck className="h-5 w-5" />
      </span>
      {showText && (
        <span className="text-lg tracking-tight text-brand-navy">
          Act<span className="text-brand-green">Prove</span>
        </span>
      )}
    </span>
  );
}
