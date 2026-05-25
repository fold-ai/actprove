import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-bold text-brand-navy">{title}</h1>
        <div className="prose mt-6 space-y-4 text-sm text-muted-foreground [&_h2]:mt-6 [&_h2]:font-semibold [&_h2]:text-foreground">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
