"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const groups = Array.from(new Set(NAV_ITEMS.map((i) => i.group ?? "")));

  return (
    <nav className="flex flex-col gap-4 px-3">
      {groups.map((group) => (
        <div key={group}>
          {group && (
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(group)}
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.filter((i) => (i.group ?? "") === group).map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-navy text-white"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
