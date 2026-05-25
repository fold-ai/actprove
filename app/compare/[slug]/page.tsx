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
import { TOOL_COMPARISONS, getToolComparison } from "@/lib/seo/tool-comparisons";
import { Check } from "lucide-react";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOOL_COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getToolComparison(slug);
  if (!c) return { title: "Compare" };
  return {
    title: c.title,
    description: c.intro,
    alternates: { canonical: `/compare/${c.slug}` },
  };
}

export default async function ToolComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = getToolComparison(slug);
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
                <TableHead className="text-brand-navy">ActProve</TableHead>
                <TableHead className="capitalize">{c.competitor}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {c.rows.map((r) => (
                <TableRow key={r.feature}>
                  <TableCell className="font-medium">{r.feature}</TableCell>
                  <TableCell className="text-sm">
                    <span className="inline-flex items-start gap-1.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                      {r.actprove}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.them}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-8 rounded-xl bg-brand-navy p-8 text-center text-white">
          <h3 className="text-xl font-bold">See ActProve for yourself</h3>
          <Button asChild variant="brand" className="mt-4">
            <Link href="/signup">Start free trial</Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {TOOL_COMPARISONS.filter((x) => x.slug !== c.slug).map((x) => (
            <Link
              key={x.slug}
              href={`/compare/${x.slug}`}
              className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
            >
              vs {x.competitor}
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
