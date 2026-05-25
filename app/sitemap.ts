import type { MetadataRoute } from "next";
import { COUNTRY_PAGES } from "@/lib/seo/countries";
import { SECTOR_PAGES } from "@/lib/seo/sectors";
import { COMPARISON_PAGES } from "@/lib/seo/comparisons";
import { TOOL_COMPARISONS } from "@/lib/seo/tool-comparisons";
import { BLOG_POSTS } from "@/lib/seo/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://actprove.com";
  const staticRoutes = [
    "",
    "/pricing",
    "/eu-ai-act",
    "/eu-ai-act/checklist",
    "/eu-ai-act/deadline",
    "/eu-ai-act/glossary",
    "/tools",
    "/tools/risk-classifier",
    "/tools/compliance-score",
    "/tools/vendor-check",
    "/developers",
    "/partners",
    "/about",
    "/changelog",
    "/blog",
    "/security",
    "/privacy",
    "/terms",
    "/login",
    "/signup",
  ];

  const dynamicRoutes = [
    ...COUNTRY_PAGES.map((c) => `/eu-ai-act/${c.slug}`),
    ...SECTOR_PAGES.map((s) => `/eu-ai-act/sector/${s.slug}`),
    ...COMPARISON_PAGES.map((c) => `/eu-ai-act/compare/${c.slug}`),
    ...TOOL_COMPARISONS.map((c) => `/compare/${c.slug}`),
    ...BLOG_POSTS.map((p) => `/blog/${p.slug}`),
  ];

  return [...staticRoutes, ...dynamicRoutes].map((r) => ({
    url: `${base}${r}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: r === "" ? 1 : r.startsWith("/eu-ai-act") ? 0.8 : 0.6,
  }));
}
