import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Topbar } from "@/components/dashboard/topbar";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { CommandPalette } from "@/components/command-palette";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/lib/i18n";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { organization: true },
  });

  if (!dbUser?.organizationId || !dbUser.organization) {
    redirect("/setup-org");
  }

  const org = dbUser.organization;
  const messages = await getMessages(org.locale);

  return (
    <NextIntlClientProvider locale={org.locale} messages={messages}>
    <div className="min-h-screen bg-gray-50">
      <CommandPalette />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-white lg:flex">
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
        <div className="border-t p-4">
          <div className="truncate text-xs font-medium text-gray-900">
            {org.name}
          </div>
          <div className="text-xs capitalize text-muted-foreground">
            {org.plan} · {org.planStatus.replace("_", " ")}
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        <Topbar name={dbUser.fullName ?? ""} email={dbUser.email} />
        <TrialBanner
          planStatus={org.planStatus}
          trialEndsAt={org.trialEndsAt}
        />
        <main className="mx-auto w-full max-w-[1280px] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
    </NextIntlClientProvider>
  );
}
