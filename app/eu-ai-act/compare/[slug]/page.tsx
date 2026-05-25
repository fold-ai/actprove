import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COMPARISON_PAGES, getComparisonPage } from "@/lib/seo/comparisons";

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARISON_PAGES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparisonPage(slug);
  if (!c) return { title: "Comparison" };
  return {
    title: `${c.title} — Key Differences Explained`,
    description: c.intro,
    alternates: { canonical: `/eu-ai-act/compare/${c.slug}` },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getComparisonPage(slug);
  if (!c) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-4xl font-bold text-brand-navy">{c.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{c.intro}</p>

        <div className="mt-8 overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>{c.aLabel}</TableHead>
                <TableHead>{c.bLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {c.rows.map((r) => (
                <TableRow key={r.dimension}>
                  <TableCell className="font-medium">{r.dimension}</TableCell>
                  <TableCell className="text-sm">{r.a}</TableCell>
                  <TableCell className="text-sm">{r.b}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-8 rounded-xl bg-secondary p-6">
          <p className="text-sm">{c.takeaway}</p>
          <Button asChild className="mt-3">
            <Link href="/signup">Start free trial</Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {COMPARISON_PAGES.filter((x) => x.slug !== c.slug).map((x) => (
            <Link
              key={x.slug}
              href={`/eu-ai-act/compare/${x.slug}`}
              className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
            >
              {x.title}
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
