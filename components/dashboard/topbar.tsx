"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Menu, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Logo } from "@/components/logo";
import { NAV_ITEMS } from "@/lib/nav";

function titleFor(pathname: string): string {
  const match = NAV_ITEMS.filter((i) => i.href !== "/dashboard").find((i) =>
    pathname.startsWith(i.href),
  );
  if (pathname === "/dashboard") return "Dashboard";
  return match?.label ?? "Dashboard";
}

export function Topbar({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const pathname = usePathname();
  const initials = (name || email || "U")
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white px-4 lg:px-6">
      {/* Mobile nav */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 pt-6">
          <div className="px-6 pb-4">
            <Logo />
          </div>
          <SidebarNav />
        </SheetContent>
      </Sheet>

      <h1 className="text-lg font-semibold">{titleFor(pathname)}</h1>

      <div className="ml-auto flex items-center gap-2">
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/dashboard/inventory?add=1">
            <Plus className="h-4 w-4" /> Add system
          </Link>
        </Button>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar>
                <AvatarFallback className="bg-brand-navy text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{name || "Account"}</div>
              <div className="text-xs font-normal text-muted-foreground">
                {email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <UserIcon className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action="/auth/signout" method="post" className="w-full">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
