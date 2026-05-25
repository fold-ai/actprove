import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/marketing/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS } from "@/lib/seo/blog";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Blog",
  description: "EU AI Act guides, how-tos and regulation news for SMBs.",
};

export default function BlogIndex() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-4xl font-bold text-brand-navy">Blog</h1>
        <p className="mt-3 text-muted-foreground">
          Practical EU AI Act guidance for European SMBs.
        </p>
        <div className="mt-8 space-y-4">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{p.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(p.date), "d MMM yyyy")}
                    </span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-brand-navy">
                    {p.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{p.excerpt}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
