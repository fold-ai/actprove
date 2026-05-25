import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS, getPost } from "@/lib/seo/blog";
import { format } from "date-fns";

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return { title: "Blog" };
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `/blog/${p.slug}` },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
          ← Blog
        </Link>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary">{p.category}</Badge>
          <span className="text-xs text-muted-foreground">
            {format(new Date(p.date), "d MMM yyyy")}
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-brand-navy">{p.title}</h1>
        <div
          className="prose-doc mt-6 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-brand-navy [&_li]:ml-4 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:my-3 [&_ul]:my-3 [&_ol]:my-3 [&_ol]:ml-4"
          dangerouslySetInnerHTML={{ __html: p.body }}
        />
        <div className="mt-10 rounded-xl bg-secondary p-6 text-center">
          <p className="text-sm font-medium">Get compliant before August 2026</p>
          <Button asChild className="mt-3">
            <Link href="/signup">Start free trial</Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Not legal advice.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
