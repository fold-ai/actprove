"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { NAV_ITEMS } from "@/lib/nav";
import { trpc } from "@/lib/trpc/client";
import { Plus, FileText, Shield, Search, Database } from "lucide-react";

const QUICK_ACTIONS = [
  { label: "Add AI system", href: "/dashboard/inventory?add=1", icon: Plus },
  { label: "Generate a document", href: "/dashboard/documents/new", icon: FileText },
  { label: "View Trust Page settings", href: "/dashboard/trust-page", icon: Shield },
  { label: "Ask the AI Advisor", href: "/dashboard/advisor", icon: Search },
];

/** Global Cmd+K command palette (spec §14.2). */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = trpc.search.global.useQuery(
    { q: query },
    { enabled: open && query.length > 1 },
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed left-1/2 top-24 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border bg-white shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b px-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search systems, documents, or jump to…"
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ESC
        </kbd>
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
          No results.
        </Command.Empty>

        {(results.data?.length ?? 0) > 0 && (
          <Command.Group
            heading="Results"
            className="px-1 text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
          >
            {results.data!.map((r) => (
              <Command.Item
                key={`${r.type}-${r.href}-${r.label}`}
                value={`${r.label} ${r.type}`}
                onSelect={() => go(r.href)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground data-[selected=true]:bg-secondary"
              >
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{r.label}</span>
                <span className="text-[10px] text-muted-foreground">{r.type}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group
          heading="Quick actions"
          className="px-1 text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
        >
          {QUICK_ACTIONS.map((a) => (
            <Command.Item
              key={a.href}
              onSelect={() => go(a.href)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground data-[selected=true]:bg-secondary"
            >
              <a.icon className="h-4 w-4 text-brand-navy" />
              {a.label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group
          heading="Navigate"
          className="px-1 text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
        >
          {NAV_ITEMS.map((item) => (
            <Command.Item
              key={item.href}
              value={item.label}
              onSelect={() => go(item.href)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground data-[selected=true]:bg-secondary"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.label}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
